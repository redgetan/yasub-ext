$(document).ready(function(){
  $("#subtitle_btn").on("click", function(event){
    event.preventDefault();

    if ($(this).hasClass("ready")) {
      console.log("creating tab: " + $(this).attr("href"));
      chrome.tabs.create({ url: $(this).attr("href") });
    } else {
      prepareEditor();
    }

  });

});

function prepareEditor() {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    var url = tabs[0].url;

    var message = { 
      type: "naver_editor",
      url: url  
    };

    var port = chrome.runtime.connect({name: "naver_editor"});
    port.postMessage({url: url});
    port.onMessage.addListener(function(msg) {
      console.log("popup cb: " + JSON.stringify(msg));
      if (msg.new_repo_url) {
        $("#subtitle_btn").text("Ready");  
        $("#subtitle_btn").addClass("ready");  
        $("#subtitle_btn").attr("href",msg.new_repo_url);  
      } else if (msg.progress) {
        $("#progress_indicator").text(msg.progress + " %");
      }
    });

  });
}
