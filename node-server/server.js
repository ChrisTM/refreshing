var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');


var dirWalk = function (dirname, callback) {
  callback(dirname);

  fs.readdir(dirname, function (err, filenames) {
    filenames.forEach(function (filename) {
      var pathname = path.join(dirname, filename);
      fs.stat(pathname, function (err, stats) {
        if (stats && stats.isDirectory()) {
          dirWalk(pathname, callback);
        }
      });
    });
  });
};

var respondOnChange = function (req, res, dirname) {
  var watcher = fs.watch(dirname, function (event, filename) {
    console.log('Change detected.', event, filename);
    if (event === 'change') {
      // there's no built-in 'end' event, so we emit it ourselves. some cleanup
      // code listens for this event
      res.emit('end');
      res.end();
    }
  });

  var closeWatcher = function () {
    if (watcher) {
      watcher.close();
    }
  };

  // clean up after finished responses
  res.on('end', closeWatcher);

  // clean up after aborted requests
  req.on('close', closeWatcher);
};

var makeEmptyView = function (statusCode) {
  return function (req, res) {
    res.statusCode = statusCode || 204;
    res.end();
  };
};

var empty200View = makeEmptyView(200); // ok!
var empty404View = makeEmptyView(404); // not found
var empty501View = makeEmptyView(501); // not implemented

var refreshingView = function (req, res) {
  var pathname = url.parse(req.url, true).query['path'];
  var dirname = path.dirname(pathname);

  console.log('Watching "' + dirname + '"');
  // Node prints warnings when more than 10 listeners are added created for a
  // given event, but we expect to attach more than that, so we suppress those
  // warnings by explicitly setting the max listeners to unlimited
  req.setMaxListeners(0);
  res.setMaxListeners(0);
  dirWalk(dirname, function (dirname) {
    respondOnChange(req, res, dirname);
  });
};

http.createServer(function (req, res) {
  var reqURL = url.parse(req.url);
  var pathname = reqURL.pathname;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;

  var pathToView =
    { '/favicon.ico': empty404View
    , '/ping/': empty200View
    , '/watch/': refreshingView
    };

  var view  = pathToView[pathname] || empty501View;
  view(req, res);

}).listen(7053, '127.0.0.1');
