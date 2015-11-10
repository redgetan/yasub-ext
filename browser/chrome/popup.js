$(document).ready(function(){
  $("#subtitle_btn").on("click", function(event){
    event.preventDefault();

    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      var url = tabs[0].url;

      var message = { 
        type: "naver_editor",
        url: url  
      };

      chrome.runtime.sendMessage(chrome.runtime.id, message, {}, function(response){
        console.log("popup cb: " + response);
        if (response.new_repo_url) {
          $("#subtitle_btn").text("Ready");  
          $("#subtitle_btn").addClass("ready");  
          $("#subtitle_btn").attr("href",response.new_repo_url);  
        } else if (response.progress) {
          $("#progress_indicator").text(response.progress + " %");
        }
      });
    });

  });

  $("#subtitle_btn.ready").on("click", function(event){
    chrome.tabs.create({ url: $(this).attr("href") });
  });
});
