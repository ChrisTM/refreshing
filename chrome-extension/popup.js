var $ = function (id) {
  return document.getElementById(id);
};

// for use as a test callback function
var pargs = function () {
  console.log(arguments);
};

// call callback with the currently active tab
var getCurrentTab = function (callback) {
  chrome.tabs.query({
    'currentWindow': true,
    'active': true
  }, function (tabArray) {
    callback(tabArray.pop());
  });
};

var bg = chrome.extension.getBackgroundPage();

window.onload = function () {
  var startEl = $('start');
  var stopEl = $('stop');

  getCurrentTab(function (tab) {
    // make the UI reflect current tab's state
    var sync = function () {
      var isRefreshing = bg.isRefreshing[tab.id];
      if (isRefreshing) {
        startEl.disabled = true;
        stopEl.disabled = false;
      } else {
        startEl.disabled = false;
        stopEl.disabled = true;
      }
    };

    var onToggle = function () {
      bg.toggleState(tab);
      sync();
    };

    sync();
    startEl.addEventListener('click', onToggle);
    stopEl.addEventListener('click', onToggle);
  });
};
