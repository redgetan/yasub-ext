var originalInitCallbackHandler = initCallbackHandler;

/*
  Events:
    loadedmetadata
    timeupdate
    seeking
    seeked
    play
    pause
    ended
*/

var url = document.location.href;
// var naver = new river.hooks.Naver({url: url});
// var popcorn = new Popcorn("#player embed");
// // naver callback
// initCallbackHandler = function(sCallbackType) {
//   console.log("sCallbackType: " + sCallbackType);

//   originalInitCallbackHandler(sCallbackType);
//   naver.onNaverStateChange(sCallbackType);
// };

var popcorn = Popcorn.naver("#player embed",url, { is_extension: true });
var repo_timings = '[{"id":3024,"start_time":22.181,"end_time":24.268,"subtitle":{"id":3966,"text":"daikoka keno yakusoku","parent_text":"","short_id":"2598KuGvm_OXPtc5IqRf"},"subtitle_id":3966,"repository_id":195},{"id":3063,"start_time":0.2,"end_time":1.996,"subtitle":{"id":4005,"text":"oh yeah","parent_text":"","short_id":"xbMQzeGcAMuWwP96ZeMc"},"subtitle_id":4005,"repository_id":195},{"id":3064,"start_time":2.196,"end_time":3.97,"subtitle":{"id":4006,"text":"shit happens","parent_text":"","short_id":"71lpPMCMVS7Ui4NcF2YO"},"subtitle_id":4006,"repository_id":195},{"id":3066,"start_time":11.096,"end_time":14.096,"subtitle":{"id":4008,"text":"droplets","parent_text":"","short_id":"zbCSKZxfr1jslF4zyVfW"},"subtitle_id":4008,"repository_id":195},{"id":3068,"start_time":24.668,"end_time":26.5,"subtitle":{"id":4010,"text":"hotsuri hitotsu","parent_text":"","short_id":"BH4FfdJ3nWtdQ1ttGyFu"},"subtitle_id":4010,"repository_id":195},{"id":3069,"start_time":27.668,"end_time":30.668,"subtitle":{"id":4011,"text":"","parent_text":"","short_id":"RcEZUJiJM806b19tCdJr"},"subtitle_id":4011,"repository_id":195},{"id":3070,"start_time":18.52,"end_time":19.84,"subtitle":{"id":4012,"text":"asdf","parent_text":"","short_id":"OLIGBQbemKwitqh_JMV3"},"subtitle_id":4012,"repository_id":195},{"id":3071,"start_time":20.331,"end_time":21.265,"subtitle":{"id":4013,"text":"","parent_text":"","short_id":"3__E6M6qV3lIlG2cQY1_"},"subtitle_id":4013,"repository_id":195}]';
var timings = JSON.parse(repo_timings);

for (var i = timings.length - 1; i >= 0; i--) {
  var startTime =  timings[i].start_time;
  var endTime =  timings[i].end_time;
  var subtitle = timings[i].subtitle.text;

  popcorn.code({
    start: startTime,
    end:   endTime,
    onStart: function(start, end, text) {
      console.log("start: " + start + "end: " + end + " -- " + text);
      document.getElementById("yasub_subtitle_bar").innerText = text;
    }.bind(this, startTime, endTime, subtitle),
    onEnd: function() {
      document.getElementById("yasub_subtitle_bar").innerText = "";
    }
  });
};

var div = document.createElement("div"); 
div.setAttribute("id","yasub_subtitle_bar"); 
document.querySelector("#player").appendChild(div);

