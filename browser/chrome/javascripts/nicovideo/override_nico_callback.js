// intercept nico callbacks [onNicoPlayerReady, onNicoPlayerStatus]
var origOnNicoPlayerReady = window.PlayerApp.namespace.player.Nicoplayer.onNicoPlayerReady;

window.PlayerApp.namespace.player.Nicoplayer.onNicoPlayerReady = function() {
  origOnNicoPlayerReady.apply(this, arguments);
  var message = "onNicoPlayerReady:";
  window.postMessage(message, "*");
}

var origOnNicoPlayerStatus = window.PlayerApp.namespace.player.Nicoplayer.onNicoPlayerStatus;

window.PlayerApp.namespace.player.Nicoplayer.onNicoPlayerStatus = function() {
  origOnNicoPlayerStatus.apply(this, arguments);

  var eventName = arguments[1];
  var message = "onNicoPlayerStatus:" + eventName;
  window.postMessage(message, "*");
}

var origUpdatePlayerSize = window.PlayerApp.namespace.player.Nicoplayer.updatePlayerSize;

window.PlayerApp.namespace.player.Nicoplayer.updatePlayerSize = function() {
  origUpdatePlayerSize.apply(this, arguments);

  var message = "updatePlayerSize:";
  window.postMessage(message, "*");
}

var origOnPlayerConfigUpdated = window.PlayerApp.namespace.player.Nicoplayer.onPlayerConfigUpdated;

window.PlayerApp.namespace.player.Nicoplayer.onPlayerConfigUpdated = function() {
  origOnPlayerConfigUpdated.apply(this, arguments);

  var message = "onPlayerConfigUpdated:";
  window.postMessage(message, "*");
}

var origOnVideoStarted = window.PlayerApp.namespace.player.Nicoplayer.onVideoStarted;

window.PlayerApp.namespace.player.Nicoplayer.onVideoStarted = function() {
  origOnVideoStarted.apply(this, arguments);

  var message = "onVideoStarted:";
  window.postMessage(message, "*");
}
