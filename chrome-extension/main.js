// `isActive` and `reqs` keep track of tab specific state.
var isActive = {};
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
  delete isActive[tabId];
  reqs[tabId] && reqs[tabId].abort();
});

// toggle the refreshing behavior on pageAction click
chrome.pageAction.onClicked.addListener(function addListener(tab) {
  isActive[tab.id] = ! isActive[tab.id];
  console.log('Refreshing is ' + (isActive[tab.id] ? 'enabled' : 'disabled'));
  syncState(tab);
});


// do whatever's needed to put the page into refreshing or not-refreshing state
var syncState = function (tab) {
  console.log('Syncing state');
  if (isActive[tab.id]) {
    chrome.pageAction.setIcon({tabId: tab.id, path: 'icon-128.png'});
    chrome.pageAction.setTitle({tabId: tab.id, title: 'Stop refreshing'});
    refreshing(tab);
  } else {
    chrome.pageAction.setIcon({tabId: tab.id, path: 'icon-grey-128.png'});
    chrome.pageAction.setTitle({tabId: tab.id, title: 'Start refreshing'});
    reqs[tab.id] && reqs[tab.id].abort();
  }
}

// attach the refreshing behavior to the tab
var refreshing = function (tab) {
  var path = tab.url.substr('file://'.length);
  var req = new XMLHttpRequest();
  reqs[tab.id] = req;
  req.open('GET', 'http://127.0.0.1:7053/?path=' + path);

  console.log('Polling for ', path);

  var onLoad = function () {
    if (req.status === 200) {
      console.log('File changed --- time to reload!');
      chrome.tabs.reload(tab.id);
    }
  };

  var onError = function () {
    console.log('Poll error. Request: ', req);
    // setTimeout used to prevent filling the call stack
    window.setTimeout(main, 0);
  };

  req.addEventListener('load', onLoad);
  req.addEventListener('error', onError);
  req.send();
  return req;
};
