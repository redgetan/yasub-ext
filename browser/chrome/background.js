var base_url = "http://dev.yasub.com:3000";

var naverPlayerToUrlMap = {};
var sourceDownloadUrlMap = {};
var naverEditorPort = null;

function queryProgress(query_progress_url) {
  $.ajax({
    url: query_progress_url,
    method: "GET",
    dataType: "json",
    success: function(data) {
      if (data.new_repo_url) {
        console.log(data.new_repo_url);
        naverEditorPort.postMessage({ new_repo_url: data.new_repo_url });
      } else {
        naverEditorPort.postMessage({ progress: data.progress });
      }
    }
  });
}

function downloadSource(videoUrl, sourceDownloadUrl) {
  console.log("inside : " + videoUrl);
  console.log("base: " + base_url + "/videos/prepare");
  $.ajax({
    url: base_url + "/videos/prepare",
    method: "POST",
    data: { source_url: videoUrl, source_download_url: sourceDownloadUrl },
    dataType: "json",
    success: function(data) {
      if (data.new_repo_url) {
        console.log(data.new_repo_url);
        naverEditorPort.postMessage({ new_repo_url: data.new_repo_url });
      } else if (data.query_progress_url) {
        queryProgress(data.query_progress_url);
      }
    }
  });
} 

// url -> 

chrome.webRequest.onResponseStarted.addListener(function(data){
  console.log("onResponseStarted: " + JSON.stringify(data));
  if (data.url.match(/smartmediarep.com/)) {
      var match;
      if (match = data.url.match(/tid=(rmcPlayer_.*)/) ) {
        naver_player_id = match[1];
        var url = naverPlayerToUrlMap[naver_player_id];
        console.log("FOUND matched onResponseStarted: ");
        sourceDownloadUrlMap[url] = data.url;
      }
  }
}, {urls: ["<all_urls>"] });

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.type === "naver_player_id") {
        naverPlayerToUrlMap[msg.naver_player_id] = msg.url;
    }

    if (msg.type === "naver_editor") {
      var sourceDownloadUrl = sourceDownloadUrlMap[msg.url];
      downloadSource(msg.url, sourceDownloadUrl);
    }
});

chrome.extension.onConnect.addListener(function(port) {
  if (port.name === "naver_editor") {
    naverEditorPort = port;
    port.onMessage.addListener(function(msg) {
      console.log(msg);
      var sourceDownloadUrl = sourceDownloadUrlMap[msg.url];
      console.log("sourceDownloadUrl: " + sourceDownloadUrl);
      downloadSource(msg.url, sourceDownloadUrl);
    });
  }
});

