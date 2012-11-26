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

  var badEl = $('connection-error');
  var fixedEl = $('connection-fixed');

  var transition = function (action) {
    state = transitionTable[state][action];
    console.log(action, 'towards', state);

    switch (state) {
      case 'good':
        badEl.style.display = 'none';
        fixedEl.style.display = 'none';
        break;
      case 'bad':
        badEl.style.display = '';
        fixedEl.style.display = 'none';
        break;
      case 'fixed':
        badEl.style.display = 'none';
        fixedEl.style.display = '';
        break;
    }

    window.setTimeout(function () {
      ping(onSuccess, onFailure);
    }, (state === 'bad') ? 1000 : 5000);
  };

  var ping = function (onSuccess, onFailure) {
    console.log('ping');
    var req = new XMLHttpRequest();
    req.open('GET', 'http://127.0.0.1:7053/ping/');
    req.addEventListener('load', onSuccess);
    req.addEventListener('error', onFailure);
    req.send();
  };

  var onSuccess = function () { transition('success'); };
  var onFailure = function () { transition('failure'); };

  ping(onSuccess, onFailure);
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

    syncUI();
    pingTest();

    startEl.addEventListener('click', onStart);
    stopEl.addEventListener('click', onStop);
  });
};
