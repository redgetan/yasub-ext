var base_url = "http://dev.yasub.com:3000";

var naverPlayerToUrlMap = {};
var sourceDownloadUrlMap = {};
var naverEditorPort = null;
var PROGRESS_QUERY_INTERVAL = 2000;
var queryProgressTimeoutList = [];

function queryProgress(query_progress_url) {
  $.ajax({
    url: query_progress_url,
    method: "GET",
    dataType: "json",
    success: function(data) {
      if (data.new_repo_url) {
        naverEditorPort.postMessage({ new_repo_url: data.new_repo_url });
      } else {
        if (data.progress === "100") {
          for (var i = 0; i < queryProgressTimeoutList.length; i++) { 
             clearTimeout(queryProgressTimeoutList[i]);
          }
          naverEditorPort.postMessage({ progress: 100 });
        } else {
          var timeout = setTimeout(function(){
            queryProgress(query_progress_url);
          }, PROGRESS_QUERY_INTERVAL);
          
          queryProgressTimeoutList.push(timeout);
          naverEditorPort.postMessage({ progress: data.progress });
        }
      }
    }
  });
}

function downloadSource(videoUrl, sourceDownloadUrl) {
  $.ajax({
    url: base_url + "/videos/prepare",
    method: "POST",
    data: { source_url: videoUrl, source_download_url: sourceDownloadUrl },
    dataType: "json",
    success: function(data) {
      if (data.new_repo_url) {
        naverEditorPort.postMessage({ new_repo_url: data.new_repo_url });
      } else if (data.query_progress_url) {
        naverEditorPort.postMessage({ progress: 0 });
        queryProgress(data.query_progress_url);
      }
    }
  });
} 

// grab the mp4 link of a tvcast.naver.com video
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
}, {urls: ["*://*.smartmediarep.com/*"] });

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "naver_editor") {
    naverEditorPort = port;
    port.onMessage.addListener(function(msg) {
      chrome.storage.local.get(msg.url, function(item){
        var sourceDownloadUrl = item[msg.url];
        if (sourceDownloadUrl) {
          downloadSource(msg.url, sourceDownloadUrl);
        } else {
          naverEditorPort.postMessage({ missing_download_url: true });
        }
      });
    });
  }
});