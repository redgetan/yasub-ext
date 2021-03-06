var base_url = "https://www.yasub.com";
var url;

$(document).ready(function(){
  getTabUrl(function(tabUrl) {
    url = tabUrl;
    if (url.match(/tvcast.naver.com/) || url.match(/nicovideo.jp\/watch\/sm/)) {
      populateCurrentVideoDetails();
      getReadyState();
    }
    populateUserRepositoryList();
    bindEvents();
  });
});

function populateCurrentVideoDetails() {
  getCurrentVideoDetails(function(data){
    if (chrome.runtime.lastError) console.log("error in callback: " + JSON.stringify(chrome.runtime.lastError));

    $("#current_video_details").show();
    $("#current_video_title").text(data.title);
    $("#current_video_thumbnail").attr("src", data.image_url);
  });
}

function populateUserRepositoryList() {
  var repo;
  var content = "";
  var subContent = "";

  $.ajax({
    url: base_url + "/repositories/current_user_repositories",
    method: "GET",
    dataType: "json",
    success: function(data) {
      if (data.not_signed_in) {
        $("#user_repository_container").append($("#sign_in_container"));
        $("#sign_in_container").show();
      } else {
        var repos = data;
        for (var i = 0; i < repos.length; i++) {
          repo = repos[i];
          subContent = "<div class='repo_item' data-href='" + repo.editor_url + "'>" +
                         "<div class='repo_item_col repo_thumbnail'><img src='" + repo.thumbnail_url + "'></div>" +
                         "<div class='repo_item_col repo_title'><span>" + repo.title + "</span></div>" +
                         "<div class='repo_item_col repo_views'><span>" + repo.views_contributed + " views</span></div>" +
                       "</div>";

          content += subContent;
        }

        $("#user_repository_container").append(content);
      }
    }
  });

}

function getTabUrl(callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    callback(tabs[0].url);
  });
}

function getCurrentVideoDetails(callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var msg = {type: 'video_details'};
    chrome.tabs.sendMessage(tabs[0].id, msg, callback);
  });
}

function bindEvents() {
  $("#subtitle_btn").on("click", function(event){
    event.preventDefault();

    if ($(this).attr("disabled") === "disabled") return;

    if ($(this).hasClass("ready")) {
      chrome.tabs.create({ url: $(this).attr("href") });
    } else {
      prepareEditor();
    }

  });

  $(document).on("click", "#sign_in_btn", function(event){
    event.preventDefault();

    var url = base_url + "/users/sign_in";
    chrome.tabs.create({ url: url });
  });

  $(document).on("click", ".repo_item", function(event){
    event.preventDefault();
    var url = $(this).data("href");
    chrome.tabs.create({ url: url });
  });
}

function prepareEditor() {
  $("#progress_indicator").text("Preparing.....0%");

  var port = chrome.runtime.connect({name: "open_editor"});
  port.postMessage({url: url});
  port.onMessage.addListener(function(msg) {
    if (msg.new_repo_url) {
      $("#progress_indicator").text("");
      $("#subtitle_btn").removeAttr("disabled");
      $("#subtitle_btn").text("Ready");  
      $("#subtitle_btn").addClass("ready");  
      $("#subtitle_btn").attr("href",msg.new_repo_url);  
    } else if (msg.progress) {
      $("#subtitle_btn").attr("disabled", "disabled");
      $("#progress_indicator").text("Preparing....." + msg.progress + " %");
    } else if (msg.missing_download_url) {
      $("#progress_indicator").text("We can't find the link for mp4...Make sure the actual video is playing");
    } else if (msg.failed) {
      $("#progress_indicator").text("Download Failed");
    }
  });
}

function getReadyState() {
  var port = chrome.runtime.connect({name: "get_ready_state"});
  port.postMessage({url: url});
  port.onMessage.addListener(function(msg) {
    if (msg.new_repo_url) {
      $("#progress_indicator").text("");
      $("#subtitle_btn").removeAttr("disabled");
      $("#subtitle_btn").text("Ready");  
      $("#subtitle_btn").addClass("ready");  
      $("#subtitle_btn").attr("href",msg.new_repo_url);  
    } else if (msg.progress) {
      $("#subtitle_btn").attr("disabled", "disabled");
      $("#progress_indicator").text("Preparing....." + msg.progress + " %");
    }
  });
}
