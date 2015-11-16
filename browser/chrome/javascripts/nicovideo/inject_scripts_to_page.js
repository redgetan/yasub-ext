(function() {
  var addScriptToDocument = function(scriptName, parentEl, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = chrome.extension.getURL(scriptName);
    if (typeof callback !== "undefined") scriptEl.onload = callback;
    parentEl.appendChild(scriptEl);
  };

  addScriptToDocument('javascripts/nicovideo/override_nico_callback.js', document.documentElement);

})();
