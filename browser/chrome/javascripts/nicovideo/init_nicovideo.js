var base_url = "https://www.yasub.com";
var popcorn;
var WAIT_FOR_RESPONSE_CALLBACK_TO_FINISH = true;
var subtitleViewingScreenMarginPercentage;
  

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
      $("#yasub_subtitle_display").text(text);
    }.bind(this, startTime, endTime, subtitle),
    onEnd: function() {
      $("#yasub_subtitle_display").text("");
    }
  });
}

function applyFontSettings($el, repo) {
    $el.css("font-family", repo.font_family);
    $el.css("font-size", repo.font_size);
    $el.css("line-height", parseInt(repo.font_size) + 2 + "px");
    $el.css("font-weight", repo.font_weight);
    $el.css("font-style", repo.font_style);
    $el.css("color", repo.font_color);
    applyOutlineColor($el,repo.font_outline_color);
}

function applyOutlineColor($el, color) {
  $el.css("text-shadow", "-1px 0 " + color + ", " +
                         "0  1px " + color + ", " +
                         "1px  0 " + color + ", " +
                         "0 -1px " + color + "  ");
}

function applyPositionSettings(repo) {
  subtitleViewingScreenMarginPercentage = repo.subtitle_position;
  if (subtitleViewingScreenMarginPercentage) {
    var subtitleTop = getSubtitleTop(subtitleViewingScreenMarginPercentage);
    $("#yasub_subtitle_bar").css("top", subtitleTop + "px");
  }
}

function initSubtitle(repo) {
    var timings = repo.timings;

    for (var i = timings.length - 1; i >= 0; i--) {
      createTrackEvent(timings[i]);
    }
}

function viewingScreenHeight() {
  var nicoControlsHeight = 65;
  return $("#external_nicoplayer").height() - nicoControlsHeight;
}

function getSubtitleMarginFromViewingScreen() {
  return parseFloat($("yasub_subtitle_bar").css("top")) / viewingScreenHeight();
}

function getSubtitleTop(marginPercentage) {
  return marginPercentage * viewingScreenHeight();
}

function onPlayerConfigUpdated() {
  if (subtitleViewingScreenMarginPercentage) {
    var subtitleTop = getSubtitleTop(subtitleViewingScreenMarginPercentage);
    $("#yasub_subtitle_bar").css("top", subtitleTop + "px");
  }
}

function updatePlayerSize() {
  if (subtitleViewingScreenMarginPercentage) {
    var subtitleTop = getSubtitleTop(subtitleViewingScreenMarginPercentage);
    $("#yasub_subtitle_bar").css("top", subtitleTop + "px");
  }
}

function onVideoStarted() {
  $("#yasub_subtitle_bar").show(); 
}

function onSubtitleDisplayDraggableStop(event) {
  subtitleViewingScreenMarginPercentage = getSubtitleMarginFromViewingScreen();
}

function initPlayer() {
  var url = document.location.href;
  popcorn = Popcorn.nicovideo("#external_nicoplayer", url, { is_extension: true });

}

$("#nicoplayerContainerInner").append("<div id='yasub_subtitle_bar' class='nicovideo'><div id='yasub_subtitle_display'></div></div>");

$("#yasub_subtitle_bar").draggable({
  cursor: "move",
  axis: "y",
  stop: onSubtitleDisplayDraggableStop
});

$("#yasub_subtitle_bar").hide(); // hide it initially so that it doesnt cover the play button in middle

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window) return;

  var message_type = event.data.split(":")[0];
  var message = event.data.split(":")[1];
  if (message_type === "onPlayerConfigUpdated") {
    onPlayerConfigUpdated();
  } else if (message_type === "updatePlayerSize") {
    updatePlayerSize();
  } else if (message_type === "onVideoStarted") {
    onVideoStarted();
  }
}, false);



// load subtitle
var repo;
var match;

if (match = document.location.hash.match(/yasub\/(.*)/)) {
  var repo_token = match[1];
  var repo_url = base_url + "/r/" + repo_token + "/serialize";

  initPlayer();
  
  ajaxGet(repo_url, function(data){
    repo = JSON.parse(data);
    initSubtitle(repo);
    applyFontSettings($("#yasub_subtitle_display"), repo);
    applyPositionSettings(repo);
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


