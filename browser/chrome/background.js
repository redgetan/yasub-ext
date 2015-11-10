var base_url = "http://dev.yasub.com:3000";

var naverPlayerToUrlMap = {};
var sourceDownloadUrlMap = {};
var naverEditorPort = null;
var PROGRESS_QUERY_INTERVAL = 2000;

function queryProgress(query_progress_url, sendResponse) {
  $.ajax({
    url: query_progress_url,
    method: "GET",
    dataType: "json",
    success: function(data) {
      if (data.new_repo_url) {
        sendResponse({ new_repo_url: data.new_repo_url });
      } else {
        sendResponse({ progress: data.progress });
        setTimeout(function(){
          queryProgress(query_progress_url, sendResponse);
        }, PROGRESS_QUERY_INTERVAL);
      }
    }
  });
}

function downloadSource(videoUrl, sourceDownloadUrl, sendResponse) {
  $.ajax({
    url: base_url + "/videos/prepare",
    method: "POST",
    data: { source_url: videoUrl, source_download_url: sourceDownloadUrl },
    dataType: "json",
    success: function(data) {
      debugger
      if (data.new_repo_url) {
        sendResponse({ new_repo_url: data.new_repo_url });
      } else if (data.query_progress_url) {
        queryProgress(data.query_progress_url, sendResponse);
      }
    }
  });
} 

// url -> 

chrome.webRequest.onResponseStarted.addListener(function(data){
  if (data.url.match(/smartmediarep.com/)) {
      var match;
      if (match = data.url.match(/tid=(rmcPlayer_.*)/) ) {
        chrome.tabs.get(data.tabId, function (tab) {
          var tab_url = tab.url.split("#")[0];
          var sourceDownloadUrl = data.url; 
          var obj = {};
          obj[tab_url] = sourceDownloadUrl;

          chrome.storage.local.set(obj, function() {
          });
        });
      }
  }
}, {urls: ["<all_urls>"] });

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.type === "naver_editor") {
      var sourceDownloadUrl = chrome.storage.local.get(msg.url, function(item){
        sourceDownloadUrl = item[msg.url];
        downloadSource(msg.url, sourceDownloadUrl, sendResponse);
        sendResponse("fuck this shit");
      });
    }
    return true;
});

