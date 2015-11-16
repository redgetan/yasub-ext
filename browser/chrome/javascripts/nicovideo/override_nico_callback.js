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
