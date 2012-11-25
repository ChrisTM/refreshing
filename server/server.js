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

var respondOnChange = function (res, dirname) {
  var watcher = fs.watch(dirname, function (event, filename) {
    console.log('Change detected.', event, filename);
    if (event === 'change') {
      res.end(event);
      watcher.close();
    }
  });
};


http.createServer(function (req, res) {
  // skip over favicon requests that'll happen while developing
  if (url.parse(req.url).pathname === '/favicon.ico') { return; }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;

  var pathname = url.parse(req.url, true).query['path'] || '/';
  var dirname = path.dirname(pathname);

  console.log('Watching "' + dirname + '"');
  dirWalk(dirname, function (dirname) {
    respondOnChange(res, dirname);
  });

}).listen(7053, '127.0.0.1');
