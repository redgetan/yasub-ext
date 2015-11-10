$(document).ready(function(){
  $("#subtitle_btn").on("click", function(event){
    event.preventDefault();

    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      var url = tabs[0].url;
      console.log("tab url is: " + url);

      var port = chrome.extension.connect({ name: "naver_editor" });
      port.postMessage({ url: url });
      port.onMessage.addListener(function(msg) {
        if (msg.new_repo_url) {
          $("#subtitle_btn").text("Ready");  
          $("#subtitle_btn").addClass("ready");  
          $("#subtitle_btn").attr("href",msg.new_repo_url);  
        } else if (msg.progress) {
          $("#progress_indicator").val(msg.progress + " %");
        }
      });
    });

  });

  $("#subtitle_btn.ready").on("click", function(event){
    chrome.tabs.create({ url: $(this).attr("href") });
  });
});
