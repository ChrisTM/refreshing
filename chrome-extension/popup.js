var $ = function (id) {
  return document.getElementById(id);
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
  var pathEl = $('path');

  getCurrentTab(function (tab) {
    // make the UI reflect current tab's state
    var syncUI = function () {
      var isRefreshing = bg.isRefreshing[tab.id];

      startEl.disabled = isRefreshing;
      stopEl.disabled = ! isRefreshing;
      pathEl.disabled = isRefreshing;

      if (isRefreshing) {
        pathEl.value = bg.path[tab.id]
      } else {
        pathEl.value = tab.url.substr('file://'.length);
      }
    };

    var onStart = function () {
      var path = pathEl.value;
      bg.start(tab, path);
      syncUI();
    };

    var onStop = function () {
      bg.stop(tab);
      syncUI();
    };

    syncUI();
    startEl.addEventListener('click', onStart);
    stopEl.addEventListener('click', onStop);
  });
};
