(function( Popcorn, window, document ) {

  var

  CURRENT_TIME_MONITOR_MS = 16,
  EMPTY_STRING = "",
  // Example: http://www.nicovideo.jp/watch/sm26803766
  regexNicovideo = /.*nicovideo.jp\/watch\/(.*)/,
  ABS = Math.abs;

  function HTMLNicoVideoElement( id, options ) {

    var self = this,
      parent = typeof id === "string" ? document.querySelector( id ) : id,
      impl = {
        src: EMPTY_STRING,
        networkState: self.NETWORK_EMPTY,
        readyState: self.HAVE_NOTHING,
        seeking: false,
        autoplay: EMPTY_STRING,
        preload: EMPTY_STRING,
        controls: false,
        loop: false,
        poster: EMPTY_STRING,
        volume: 1,
        muted: false,
        currentTime: 0,
        duration: NaN,
        ended: false,
        paused: true,
        options: options,
        error: null
      },
      playerReady = false,
      mediaReady = false,
      loopedPlay = false,
      player,
      playerPaused = true,
      lastLoadedFraction = 0,
      currentTimeInterval,
      timeUpdateInterval,
      lastPlayerTime;

    // Namespace all events we'll produce
    self._eventNamespace = Popcorn.guid( "HTMLNicoVideoElement::" );

    self.parentNode = parent;

    self._util.type = "Nico";

    function listenToNicoCallback() {
      window.addEventListener("message", function(event) {
        // We only accept messages from ourselves
        if (event.source != window) return;

        var message_type = event.data.split(":")[0];
        var message = event.data.split(":")[1];
        if (message_type === "onNicoPlayerReady") {
          onNicoPlayerReady();
        } else if (message_type === "onNicoPlayerStatus") {
          onNicoPlayerStatus(message);
        }
      }, false);
    }

    listenToNicoCallback();

    function onNicoPlayerReady() {
      // dispatch loaded metadata  

      playerReady = true;

      impl.duration = player.ext_getTotalTime();
      impl.readyState = self.HAVE_METADATA;
      self.dispatchEvent( "loadedmetadata" );
      currentTimeInterval = setInterval( monitorCurrentTime,
                                         CURRENT_TIME_MONITOR_MS );
      
      self.dispatchEvent( "loadeddata" );

      impl.readyState = self.HAVE_FUTURE_DATA;
      self.dispatchEvent( "canplay" );

      // We can't easily determine canplaythrough, but will send anyway.
      impl.readyState = self.HAVE_ENOUGH_DATA;
      self.dispatchEvent( "canplaythrough" );

      self.dispatchEvent( "loadstart" );
    }

    function getDuration() {
      return player.ext_getTotalTime();
    }

    function onNicoPlayerStatus( eventName ) {
      switch( eventName ) {

        // ended
        case "end":
          onEnded();
          break;

        // playing
        case "playing":
          impl.paused = false;
          onPlay();
          break;

        // paused
        case "paused":
          onPause();
          break;

        // paused
        case "seeking":
          onSeeking();
          onSeeked();
          break;
      }
    }

    function destroyPlayer() {
      if( !( playerReady && player ) ) {
        return;
      }
      clearInterval( currentTimeInterval );
      player.ext_play(false);

      while (parent.hasChildNodes()) {
        parent.removeChild(parent.lastChild);
      }
    }

    function changeSrc( aSrc ) {
      if( !self._canPlaySrc( aSrc ) ) {
        impl.error = {
          name: "MediaError",
          message: "Media Source Not Supported",
          code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        };
        self.dispatchEvent( "error" );
        return;
      }

      impl.src = aSrc;

      if( playerReady ) {
        destroyPlayer();
      }

      // Get ID out of nicovideo url
      aSrc = regexNicovideo.exec( aSrc )[ 1 ];

      if (impl.options.is_extension) {
        player = document.querySelector("#external_nicoplayer");
      } else {
        var oldDocumentWrite = document.write;

        document.write = function(node){
          $(parent).append(node);
        };

        $.getScript("http://ext.nicovideo.jp/thumb_watch/" + aSrc, function() {
          document.write = oldDocumentWrite;
          player = document.external_nico_0; // the nicoplayer flash object
          self.dispatchEvent("nicothumbloaded");
        });
      }
    }

    function monitorCurrentTime() {
      var playerTime = player.ext_getPlayheadTime();
      var playing = player.ext_getStatus();

      if ( !impl.seeking ) {

        // var oldCurrentTime = impl.currentTime;

        // making nico player emit time at 60fps - http://stackoverflow.com/a/24514978/803865
        var playerTimeHasNotChanged = lastPlayerTime == playerTime;
        if (playing == 1 && playerTimeHasNotChanged) {
          impl.currentTime += CURRENT_TIME_MONITOR_MS/1000;
        } else {
          impl.currentTime = playerTime;
        }

        // if (ABS( oldCurrentTime - playerTime ) > 0) {
        //   onTimeUpdate();
        // }

        if ( ABS( impl.currentTime - playerTime ) > CURRENT_TIME_MONITOR_MS ) {
          // no need
          onSeeking();
          onSeeked();
        }
      } else if ( ABS( playerTime - impl.currentTime ) < 1 ) {
        onSeeked();
      }

      lastPlayerTime = playerTime;
    }

    function getCurrentTime() {
      return impl.currentTime;
    }

    function changeCurrentTime( aTime ) {
      if (!playerReady) return;
      
      onSeeking();
      player.ext_setPlayheadTime( aTime );
      impl.currentTime = player.ext_getPlayheadTime();
    }

    function onTimeUpdate() {
      self.dispatchEvent( "timeupdate" );
    }

    function onSeeking() {
      impl.seeking = true;
      self.dispatchEvent( "seeking" );
    }

    function onSeeked() {
      impl.ended = false;
      impl.seeking = false;
      self.dispatchEvent( "timeupdate" );
      self.dispatchEvent( "seeked" );
      self.dispatchEvent( "canplay" );
      self.dispatchEvent( "canplaythrough" );
    }

    function onPlay() {

      if( impl.ended ) {
        changeCurrentTime( 0 );
        impl.ended = false;
      }
      clearInterval(timeUpdateInterval);
      timeUpdateInterval = setInterval( onTimeUpdate,
                                        self._util.TIMEUPDATE_MS );
      impl.paused = false;

      if( playerPaused ) {
        playerPaused = false;

        // Only 1 play when video.loop=true
        if ( ( impl.loop && !loopedPlay ) || !impl.loop ) {
          loopedPlay = true;
          self.dispatchEvent( "play" );
        }
        self.dispatchEvent( "playing" );
      }
    }

    function onProgress() {
      self.dispatchEvent( "progress" );
    }

    self.play = function() {
      if (!playerReady) return;
      
      impl.paused = false;
      player.ext_play(true);
    };


    function getRealLoadedFraction() {
      var fraction = player.ext_getLoadedRatio();
      var totalTime = player.ext_getTotalTime();

      var loadedTime = fraction * totalTime;
      var playerTime = player.ext_getPlayheadTime();

      if (loadedTime < playerTime) {
        return playerTime / totalTime;
      } else {
        return fraction;
      }
    }

    function onPause() {
      impl.paused = true;
      if ( !playerPaused ) {
        playerPaused = true;
        clearInterval( timeUpdateInterval );
        self.dispatchEvent( "pause" );
      }
    }

    self.pause = function() {
      if (!playerReady) return;
      impl.paused = true;
      player.ext_play(false);
    };

    function onEnded() {
      if( impl.loop ) {
        changeCurrentTime( 0 );
        self.play();
      } else {
        impl.ended = true;
        onPause();
        self.dispatchEvent( "timeupdate" );
        self.dispatchEvent( "ended" );
      }
    }

    function setVolume( aValue ) {
      if (!playerReady) return;

      impl.volume = aValue;
      player.ext_setVolume( impl.volume * 100 );
      self.dispatchEvent( "volumechange" );
    }

    function getVolume() {
      // Nico has ext_getVolume(), but for sync access we use impl.volume
      return impl.volume;
    }

    function setMuted( aValue ) {
      if (!playerReady) return;
      
      impl.muted = aValue;
      setVolume(0);
      self.dispatchEvent( "volumechange" );
    }

    function getMuted() {
      return impl.muted;
    }

    Object.defineProperties( self, {

      src: {
        get: function() {
          return impl.src;
        },
        set: function( aSrc ) {
          if( aSrc && aSrc !== impl.src ) {
            changeSrc( aSrc );
          }
        }
      },

      autoplay: {
        get: function() {
          return impl.autoplay;
        },
        set: function( aValue ) {
          impl.autoplay = self._util.isAttributeSet( aValue );
        }
      },

      loop: {
        get: function() {
          return impl.loop;
        },
        set: function( aValue ) {
          impl.loop = self._util.isAttributeSet( aValue );
        }
      },

      width: {
        get: function() {
          return self.parentNode.offsetWidth;
        }
      },

      height: {
        get: function() {
          return self.parentNode.offsetHeight;
        }
      },

      currentTime: {
        get: function() {
          return getCurrentTime();
        },
        set: function( aValue ) {
          changeCurrentTime( aValue );
        }
      },

      duration: {
        get: function() {
          return getDuration();
        }
      },

      ended: {
        get: function() {
          return impl.ended;
        }
      },

      paused: {
        get: function() {
          return impl.paused;
        }
      },

      seeking: {
        get: function() {
          return impl.seeking;
        }
      },

      readyState: {
        get: function() {
          return impl.readyState;
        }
      },

      networkState: {
        get: function() {
          return impl.networkState;
        }
      },

      playerObject: {
        get: function () {
          return player;
        }
      },

      volume: {
        get: function() {
          var volume = getVolume();
          return volume / 100;
        },
        set: function( aValue ) {
          if( aValue < 0 || aValue > 1 ) {
            throw "Volume value must be between 0.0 and 1.0";
          }

          setVolume( aValue );
        }
      },

      muted: {
        get: function() {
          return getMuted();
        },
        set: function( aValue ) {
          setMuted( self._util.isAttributeSet( aValue ) );
        }
      },

      error: {
        get: function() {
          return impl.error;
        }
      },

      buffered: {
        get: function () {
          var timeRanges = {
            start: function( index ) {
              if ( index === 0 ) {
                return 0;
              }

              //throw fake DOMException/INDEX_SIZE_ERR
              throw "INDEX_SIZE_ERR: DOM Exception 1";
            },
            end: function( index ) {
              var duration;
              if ( index === 0 ) {
                duration = getDuration();
                if ( !duration ) {
                  return 0;
                }
                
                return duration * getRealLoadedFraction();
              }

              //throw fake DOMException/INDEX_SIZE_ERR
              throw "INDEX_SIZE_ERR: DOM Exception 1";
            }
          };

          Object.defineProperties( timeRanges, {
            length: {
              get: function() {
                return 1;
              }
            }
          });

          return timeRanges;
        }
      }
    });
  }

  HTMLNicoVideoElement.prototype = new Popcorn._MediaElementProto();
  HTMLNicoVideoElement.prototype.constructor = HTMLNicoVideoElement;

  // Helper for identifying URLs we know how to play.
  HTMLNicoVideoElement.prototype._canPlaySrc = function( url ) {
    return (regexNicovideo).test( url ) ?
      "probably" :
      EMPTY_STRING;
  };

  Popcorn.HTMLNicoVideoElement = function( id, options ) {
    return new HTMLNicoVideoElement( id, options );
  };
  Popcorn.HTMLNicoVideoElement._canPlaySrc = HTMLNicoVideoElement.prototype._canPlaySrc;

  Popcorn.player( "nicovideo", {
    _canPlayType: function( nodeName, url ) {
      return ( typeof url === "string" &&
               Popcorn.HTMLNicoVideoElement._canPlaySrc( url ) );
    }
  });

  Popcorn.nicovideo = function( container, url, options ) {
    var media = Popcorn.HTMLNicoVideoElement( container, options ),
        popcorn = Popcorn( media, options );

    media.src = url;

    return popcorn;
  };

}( Popcorn, window, document ));
