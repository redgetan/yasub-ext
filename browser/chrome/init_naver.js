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

function onYasubExpandBtnClick() {
  var target = document.querySelector("#player");
  if (!screenfull.isFullscreen) {
    screenfull.request(target);
    document.getElementById("yasub_expand_btn").className += " fullscreen";
    document.getElementById("yasub_overlay").className += " fullscreen";
    document.getElementById("yasub_subtitle_bar").className += " fullscreen";
  } else {
    screenfull.exit();
    document.getElementById("yasub_expand_btn").className = document.getElementById("yasub_expand_btn").className.replace(/\bfullscreen\b/,'');
    document.getElementById("yasub_overlay").className = document.getElementById("yasub_overlay").className.replace(/\bfullscreen\b/,'');
    document.getElementById("yasub_subtitle_bar").className = document.getElementById("yasub_subtitle_bar").className.replace(/\bfullscreen\b/,'');
    
  }
}

document.addEventListener(screenfull.raw.fullscreenchange, function () {
  if (!screenfull.isFullscreen) {
    // after fullscreen exit, recreate yasub_expand_btn and reattach events (othewise, positioning is out of whack)
    document.getElementById("yasub_expand_btn").outerHTML = '';
    attachDiv("#yasub_expand_btn", "#player");
    document.getElementById("yasub_expand_btn").onclick = onYasubExpandBtnClick;
    document.getElementById("yasub_expand_btn").onmouseover = onYasubExpandBtnMouseOver;
    document.getElementById("yasub_expand_btn").onmouseleave = onYasubExpandBtnMouseLeave;
  }
});

function onYasubExpandBtnMouseOver() {
  document.getElementById("yasub_expand_btn").className += " hovered";
}

function onYasubExpandBtnMouseLeave() {
  document.getElementById("yasub_expand_btn").className = document.getElementById("yasub_expand_btn").className.replace(/\bhovered\b/,'');
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
attachDiv("#yasub_expand_btn", "#player");

// events
document.getElementById("yasub_overlay").onclick = onYasubOverlayClick;
document.getElementById("yasub_expand_btn").onclick = onYasubExpandBtnClick;
document.getElementById("yasub_expand_btn").onmouseover = onYasubExpandBtnMouseOver;
document.getElementById("yasub_expand_btn").onmouseleave = onYasubExpandBtnMouseLeave;
popcorn.on("loadedmetadata", onLoadedMetadata);

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


