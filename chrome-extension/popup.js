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

var ping = function (targetURL, onSuccess, onFailure) {
  var req = new XMLHttpRequest();
  req.open('GET', targetURL);
  req.addEventListener('load', onSuccess);
  req.addEventListener('error', onFailure);
  req.send();
};

// monitor connectivity to the server, telling the user if connection goes down
// (as long as they're looking at the popup)
var pingTest = function () {
  var state = 'start';
  // this table tells us which UI state to enter when we have a ping
  // success/failure. If we were in state 'bad', and had a ping success, then
  // `transitionTable['bad']['success']` tells us that we'll enter the fixed
  // state.
  var transitionTable =
    { 'start': { 'success': 'good',  'failure': 'bad' }
    , 'good':  { 'success': 'good',  'failure': 'bad' }
    , 'bad':   { 'success': 'fixed', 'failure': 'bad' }
    , 'fixed': { 'success': 'fixed', 'failure': 'bad' }
    };

  var badPingEl = $('connection-error');
  var fixedPingEl = $('connection-fixed');

  // update the UI to reflect that `action` just happened
  var transition = function (action) {
    state = transitionTable[state][action];

    switch (state) {
      case 'good':
        badPingEl.style.display = 'none';
        fixedPingEl.style.display = 'none';
        break;
      case 'bad':
        badPingEl.style.display = '';
        fixedPingEl.style.display = 'none';
        break;
      case 'fixed':
        badPingEl.style.display = 'none';
        fixedPingEl.style.display = '';
        break;
    }
  };

  var onSuccess = function () { transition('success'); };
  var onFailure = function () { transition('failure'); };

  var testContinuously = function () {
    ping('http://127.0.0.1:7053/ping/', onSuccess, onFailure);

    // we test more quickly when in a failure state because we assume the user
    // is trying to fix the problem and we want to give them fast feedback
    window.setTimeout(function () {
      testContinuously();
    }, (state === 'bad') ? 1000 : 5000);
  };

  testContinuously();
};

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

    startEl.addEventListener('click', onStart);
    stopEl.addEventListener('click', onStop);
    syncUI();

    pingTest('http://127.0.0.1:7053/ping/');

  });
};
