var http = require('http');
var url = require('url');
var fs = require('fs');


var server = http.createServer(function (req, res) {
  // skip over favicon requests that'll happen while developing
  if (url.parse(req.url).pathname === '/favicon.ico') { return; }

  // path will be from window.location.pathname
  var path = url.parse(req.url, true).query['path'] || '/';

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;

  console.log('Watching "' + path + '"');
  fs.watch(path, function (event, filename) {
    console.log('Change detected.');
    res.end(event);
  });
});

server.listen(7053, '127.0.0.1');
