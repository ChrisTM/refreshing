var main = function () {
  console.log('Polling...');

  var path = '/home/chrism/Documents/Programming/refreshing/fake-project/index.txt'
  var req = new XMLHttpRequest();
  req.open('GET', 'http://127.0.0.1:7053/?path=' + path, false);

  var onLoad = function () {
    if (req.status === 200) {
      console.log('  File changed --- time to reload!');
    } else {
      console.log('  Unexpected HTTP status: ', req.status);
    }
  };

  var onError = function () {
    console.log('  Poll error. Request: ', req);
    // setTimeout used to prevent filling the call stack
    window.setTimeout(main, 0);
  };

  req.addEventListener('load', onLoad);
  req.addEventListener('error', onError);
  req.send();
};

document.addEventListener('DOMContentLoaded', main);
