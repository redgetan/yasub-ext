var checkPresenceOfCallbackHandlerInterval =  setInterval(function(){ 
  if (typeof initCallbackHandler === "function") {
    var originalInitCallbackHandler = initCallbackHandler;

    window["initCallbackHandler"] = function(sCallbackType) {
      originalInitCallbackHandler(sCallbackType);
      // IMPORTANT: 
      // 
      // As of Nov 6 2015, naver also listens to window "message" events, 
      // and rmcplayer3_launcher_XXXXXX.js expects message to be a string or 
      // at least respond to the function "split" T.split("|")
      //
      // To prevent triggering a javascript error on their code, our postMessage message param should also be a string
      var message = "sCallbackType:" + sCallbackType;
      window.postMessage(message, "*");
    };
    clearInterval(checkPresenceOfCallbackHandlerInterval);
  }
}, 100);

