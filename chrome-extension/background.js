'use strict';

// these keep track of tab specific state.
var isRefreshing = {};
var path = {};
var reqs = {};

// show/hide the page action depending on url
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status !== 'complete') {
    return;
  }

  if (/^file:\/\//.test(tab.url)) {
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }

  syncState(tab);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  delete isRefreshing[tabId];
  reqs[tabId] && reqs[tabId].abort();
});

var start = function (tab, path_) {
  isRefreshing[tab.id] = true;
  path[tab.id] = path_;
  syncState(tab);
};

var stop = function (tab) {
  isRefreshing[tab.id] = false;
  syncState(tab);
};

// do whatever's needed to put the page into refreshing or not-refreshing state
var syncState = function (tab) {
  if (isRefreshing[tab.id]) {
    chrome.pageAction.setIcon({tabId: tab.id, path: 'icons/16-on.png'});
    chrome.pageAction.setTitle({tabId: tab.id, title: 'Refreshing is started'});

    refreshing(tab);
    console.info('Refreshing started');
  } else {
    chrome.pageAction.setIcon({tabId: tab.id, path: 'icons/16-off.png'});
    chrome.pageAction.setTitle({tabId: tab.id, title: 'Refreshing is stopped'});

    reqs[tab.id] && reqs[tab.id].abort();
    console.info('Refreshing stopped');
  }
}

// attach the refreshing behavior to the tab
var refreshing = function (tab) {
  var path_ = path[tab.id];
  var req = new XMLHttpRequest();
  reqs[tab.id] = req;
  req.open('GET', 'http://127.0.0.1:7053/watch/?path=' + path_);

  console.log('Polling for', path_);

  var onLoad = function () {
    if (req.status === 200) {
      console.log('File changed --- time to reload!');
      chrome.tabs.reload(tab.id);
    }
  };

  var onError = function () {
    console.error('Poll error. Request:', req);
    // setTimeout used to prevent filling the call stack
    window.setTimeout(function () {
      refreshing(tab, path_);
    }, 1000);
  };

  req.addEventListener('load', onLoad);
  req.addEventListener('error', onError);
  req.send();
  return req;
};
