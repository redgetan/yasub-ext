(function( Popcorn, window, document ) {

  var

  NAVER_CURRENT_TIME_INDEX = 0;
  NAVER_DURATION_INDEX = 1;
  CURRENT_TIME_MONITOR_MS = 16,
  EMPTY_STRING = "",
  // Example: http://tvcast.naver.com/v/449999
  regexNaver = /.*tvcast.naver.com\/v\/(.*)/,
  ABS = Math.abs;

  function HTMLNaverElement( id, options ) {

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
      firstPlay = true,
      lastPlayerTime;

    // Namespace all events we'll produce
    self._eventNamespace = Popcorn.guid( "HTMLNaverElement::" );

    self.parentNode = parent;

    self._util.type = "Naver";

    if (impl.options.is_extension) {
      var originalInitCallbackHandler = initCallbackHandler;
    }

    window["initCallbackHandler"] = function(sCallbackType) {
      if (impl.options.is_extension) {
        originalInitCallbackHandler(sCallbackType);
      }
      onNaverStateChange(sCallbackType);
    };

    function onNaverStateChange(sCallbackType) {
      console.log("mario: " + sCallbackType);

      playerReady = true;

      switch(sCallbackType) {
        case "stop":
          onEnded();
          break;

        case "connect":
          impl.duration = player.getVideoTimes()[NAVER_DURATION_INDEX];
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
          break;

        case "play":
          onPlay();
          break;

        case "pause":
          onPause();
          break;

      }
    }

    function getDuration() {
      return player.getVideoTimes()[NAVER_DURATION_INDEX];
    }

    function destroyPlayer() {
      if( !( playerReady && player ) ) {
        return;
      }
      clearInterval( currentTimeInterval );
      player.stopVideo();

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

      // Get ID out of url
      aSrc = regexNaver.exec( aSrc )[ 1 ];

      if (impl.options.is_extension) {
        // player already exist, just need to attach to it
        player = document.querySelector("#player embed");
      } else {
        embedExternalPlayer(function(result){
          player = result;
        })
      }
    }

    function embedExternalPlayer(cb){
      $.get(repo.naver_embed_html_url, function(data) {
        document.getElementById("media").innerHTML = data; // write the flash embed
        player = document.querySelector("embed"); 
        cb(player);
      });
    }

    function monitorCurrentTime() {
      var playerTime = player.getVideoTimes()[NAVER_CURRENT_TIME_INDEX];

      if ( !impl.seeking ) {

        // var oldCurrentTime = impl.currentTime;

        // making nico player emit time at 60fps - http://stackoverflow.com/a/24514978/803865
        var playerTimeHasNotChanged = lastPlayerTime == playerTime;
        if (!impl.paused && playerTimeHasNotChanged) {
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
      player.seekVideo( aTime );
      impl.currentTime = player.getVideoTimes()[NAVER_CURRENT_TIME_INDEX];
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
          if (!impl.options.is_extension) self.dispatchEvent( "play" );
        }
        self.dispatchEvent( "playing" );
      }
    }

    function onProgress() {
      self.dispatchEvent( "progress" );
    }

    self.play = function() {
      if (impl.options.is_extension) return;
      if (!playerReady) return;
      
      impl.paused = false;
      player.playVideo();
    };


    function onPause() {
      impl.paused = true;
      if ( !playerPaused ) {
        playerPaused = true;
        clearInterval( timeUpdateInterval );
        self.dispatchEvent( "pause" );
      }
    }

    self.pause = function() {
      if (impl.options.is_extension) return;
      if (!playerReady) return;
      impl.paused = true;
      player.pauseVideo();
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
      // no available api in naver
    }

    function getVolume() {
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
      }
    });
  }

  HTMLNaverElement.prototype = new Popcorn._MediaElementProto();
  HTMLNaverElement.prototype.constructor = HTMLNaverElement;

  // Helper for identifying URLs we know how to play.
  HTMLNaverElement.prototype._canPlaySrc = function( url ) {
    return (regexNaver).test( url ) ?
      "probably" :
      EMPTY_STRING;
  };

  Popcorn.HTMLNaverElement = function( id, options ) {
    return new HTMLNaverElement( id, options );
  };
  Popcorn.HTMLNaverElement._canPlaySrc = HTMLNaverElement.prototype._canPlaySrc;

  Popcorn.player( "naver", {
    _canPlayType: function( nodeName, url ) {
      return ( typeof url === "string" &&
               Popcorn.HTMLNaverElement._canPlaySrc( url ) );
    }
  });

  Popcorn.naver = function( container, url, options ) {
    var media = Popcorn.HTMLNaverElement( container, options ),
        popcorn = Popcorn( media, options );

    media.src = url;

    return popcorn;
  };

}( Popcorn, window, document ));

