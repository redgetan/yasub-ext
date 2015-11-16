var base_url = "https://www.yasub.com";
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

function initNaverPlayer() {
  var url = document.location.href;
  popcorn = Popcorn.naver("#player embed",url, { is_extension: true });

  // create divs
  attachDiv("#yasub_subtitle_bar", "#player");
  attachDiv("#yasub_overlay", "#player");
  attachDiv("#yasub_expand_btn", "#player");

  $("#yasub_subtitle_bar").hide();

  // events

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

  document.getElementById("yasub_overlay").onclick = onYasubOverlayClick;
  document.getElementById("yasub_expand_btn").onclick = onYasubExpandBtnClick;
  document.getElementById("yasub_expand_btn").onmouseover = onYasubExpandBtnMouseOver;
  document.getElementById("yasub_expand_btn").onmouseleave = onYasubExpandBtnMouseLeave;
  popcorn.on("loadedmetadata", onLoadedMetadata);
}

// load subtitle
var repo;
var match;

if (document.location.hash.match("editor")) {
  // prepare editor view
  var iframe = document.createElement("iframe"); 
  iframe.src = base_url + "/r/nXPr8qHKKHE/editor";
  iframe.setAttribute("id", "yasub_iframe");
  iframe.setAttribute("width", "100%");
  iframe.setAttribute("height", "100%");

  document.documentElement.appendChild(iframe);
} else if (match = document.location.hash.match(/yasub\/(.*)/)) {
  var repo_token = match[1];
  var repo_url = base_url + "/r/" + repo_token + "/serialize";

  initNaverPlayer();
  
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
      title: $("meta[property='og:title']").attr("content"),
      image_url:  $("meta[property='og:image']").attr("content")
    };

    response(details);
    return WAIT_FOR_RESPONSE_CALLBACK_TO_FINISH;
  }
});


