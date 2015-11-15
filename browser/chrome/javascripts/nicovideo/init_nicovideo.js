var base_url = "http://dev.yasub.com:3000";
var popcorn;
var WAIT_FOR_RESPONSE_CALLBACK_TO_FINISH = true;
  

function ajaxGet(url, callback){
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      callback(xhttp.responseText, xhttp.status, xhttp);  
    }
  };
  // xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.open("GET", url, true);
  xhttp.send();
}

function createTrackEvent(timing) {
  var startTime =  timing.start_time;
  var endTime =  timing.end_time;
  var subtitle = timing.subtitle.text;

  popcorn.code({
    start: startTime,
    end:   endTime,
    onStart: function(start, end, text) {
      document.getElementById("yasub_subtitle_bar").innerText = text;
    }.bind(this, startTime, endTime, subtitle),
    onEnd: function() {
      document.getElementById("yasub_subtitle_bar").innerText = "";
    }
  });
}

function onLoadedMetadata() {
  document.getElementById("yasub_subtitle_bar").style.display = "inline-block";  
}

function initPlayer() {
  var url = document.location.href;
  popcorn = Popcorn.naver("#player embed",url, { is_extension: true });

  // events
  popcorn.on("loadedmetadata", onLoadedMetadata);
}

// load subtitle
var repo;
var match;

if (match = document.location.hash.match(/yasub\/(.*)/)) {
  var repo_token = match[1];
  var repo_url = base_url + "/r/" + repo_token + "/serialize";

  initPlayer();
  
  ajaxGet(repo_url, function(data){
    repo = JSON.parse(data);
    var timings = repo.timings;

    for (var i = timings.length - 1; i >= 0; i--) {
      createTrackEvent(timings[i]);
    }

  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  if (msg.type === "video_details") {
    var details = {
      title: $(".videoHeaderTitle").text(),
      image_url:  $(".videoThumbnailImage").first().attr("src")
    };

    response(details);
    return WAIT_FOR_RESPONSE_CALLBACK_TO_FINISH;
  }
});


