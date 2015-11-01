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

function attachDiv(sourceSelector, targetSelector) {
  var div = document.createElement("div"); 
  if (sourceSelector[0] === "#") {
    div.setAttribute("id",sourceSelector.substr(1,sourceSelector.length)); 
  } 
  document.querySelector(targetSelector).appendChild(div);
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

function onYasubOverlayClick() {
  if (popcorn.media.paused) {
    popcorn.play();
  } else {
    popcorn.pause();
  }
}

function onLoadedMetadata() {
  document.getElementById("yasub_subtitle_bar").style.display = "inline-block";  
  document.getElementById("yasub_overlay").style.display = "block";  
}

var url = document.location.href;
var popcorn = Popcorn.naver("#player embed",url, { is_extension: true });

// create divs
attachDiv("#yasub_subtitle_bar", "#player");
attachDiv("#yasub_overlay", "#player");

// events
document.getElementById("yasub_overlay").onclick = onYasubOverlayClick;
popcorn.on("loadedmetadata", onLoadedMetadata);

// override fullscreen (instead of targeting the flash embed, 
// target the player div container instead so the overlayed subtitles can be shown)

overrideRequestFullscreenForEmbed();
overrideExitFullscreenForEmbed();

// load subtitle
var repo;
var repo_token = document.location.hash.replace("#","");
var repo_url = "http://dev.yasub.com:3000/r/" + repo_token + "/serialize";

ajaxGet(repo_url, function(data){
  repo = JSON.parse(data);
  var timings = repo.timings;

  for (var i = timings.length - 1; i >= 0; i--) {
    createTrackEvent(timings[i]);
  }

});


