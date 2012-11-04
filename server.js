var http = require('http');
var url = require('url');

var server = http.createServer(function (req, res) {
  // path should be from window.location.pathname
  var path = url.parse(req.url, true).query['path'];

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(path);
})

server.listen(7053, '127.0.0.1');
