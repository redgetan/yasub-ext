(function() {
  var addScriptToDocument = function(scriptName, parentEl, callback) {
    var scriptEl = document.createElement('script');
    scriptEl.src = chrome.extension.getURL(scriptName);
    if (typeof callback !== "undefined") scriptEl.onload = callback;
    parentEl.appendChild(scriptEl);
  };

  addScriptToDocument('screenfull.js', document.head, function(){
    addScriptToDocument('popcorn-complete.js', document.head, function(){
      addScriptToDocument('popcorn_naver.js', document.head, function(){
        addScriptToDocument('init_naver.js', document.documentElement);
      });
    }); 
  });

})();
