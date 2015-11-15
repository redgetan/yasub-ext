var base_url = "http://dev.yasub.com:3000";

var naverPlayerToUrlMap = {};
var sourceDownloadUrlMap = {};
var popupPort = null;
var PROGRESS_QUERY_INTERVAL = 2000;
var queryProgressTimeoutList = [];

function queryProgress(query_progress_url) {
  $.ajax({
    url: query_progress_url,
    method: "GET",
    dataType: "json",
    success: function(data) {
      if (data.failed) {
        popupPort.postMessage({ failed: true });
      } else if (data.new_repo_url) {
        popupPort.postMessage({ new_repo_url: data.new_repo_url });
      } else {
        if (data.progress === "100") {
          for (var i = 0; i < queryProgressTimeoutList.length; i++) { 
             clearTimeout(queryProgressTimeoutList[i]);
          }
          popupPort.postMessage({ progress: 100 });
        } else {
          var timeout = setTimeout(function(){
            queryProgress(query_progress_url);
          }, PROGRESS_QUERY_INTERVAL);
          
          queryProgressTimeoutList.push(timeout);
          popupPort.postMessage({ progress: data.progress });
        }
      }
    }
  });
}

function getReadyState(videoUrl, callback) {
  $.ajax({
    url: base_url + "/videos/ready_state",
    data: { source_url: videoUrl },
    method: "GET",
    dataType: "json",
    success: function(data) {
      if (data.ready_state === "ready") {
        callback({ new_repo_url: data.new_repo_url });
      } else if (data.ready_state === "download_in_progress") {
        popupPort.postMessage({ progress: 0 });
        queryProgress(data.query_progress_url);
      }
    }
  });
}

function downloadSource(videoUrl, sourceDownloadUrl) {
  var postData = { 
    source_url: videoUrl, 
    source_download_url: sourceDownloadUrl 
  };

  if (videoUrl.match(/nicovideo.jp/)) {
    chrome.cookies.get({url: "http://www.nicovideo.jp", name: "nicohistory" },function(data){ 
      postData.cookie = "nicohistory=" + data.value;

      $.ajax({
        url: base_url + "/videos/prepare",
        method: "POST",
        data: postData,
        dataType: "json",
        success: function(data) {
          if (data.new_repo_url) {
            popupPort.postMessage({ new_repo_url: data.new_repo_url });
          } else if (data.query_progress_url) {
            popupPort.postMessage({ progress: 0 });
            queryProgress(data.query_progress_url);
          }
        }
      });
    });
  }

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

// grab the mp4 link of a nicovideo
chrome.webRequest.onResponseStarted.addListener(function(data){
  var contentType = data.responseHeaders.filter(function(header){ return header.name === "Content-Type"  })[0];
  if (contentType && contentType.value === "video/mp4") {
    chrome.tabs.get(data.tabId, function (tab) {
      var tab_url = tab.url.split("#")[0];
      var sourceDownloadUrl = data.url; 
      var obj = {};
      obj[tab_url] = sourceDownloadUrl;

      chrome.storage.local.set(obj, function() {});
    });
  }
}, {urls: ["*://*.nicovideo.jp/*"] }, ["responseHeaders"]);

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "open_editor") {
    popupPort = port;
    port.onMessage.addListener(function(msg) {
      chrome.storage.local.get(msg.url, function(item){
        var sourceDownloadUrl = item[msg.url];
        if (sourceDownloadUrl) {
          downloadSource(msg.url, sourceDownloadUrl);
        } else {
          popupPort.postMessage({ missing_download_url: true });
        }
      });
    });
  } else if (port.name === "get_ready_state") {
    popupPort = port;
    port.onMessage.addListener(function(msg) {
      getReadyState(msg.url, function(data){
        popupPort.postMessage(data);
      });
    });
  }
});