var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

// A list of extensions that should cause the server to send the refresh
// signal. Later versions might move this list or the behavior to the browser
// so that the extensions are configurable via the browser extension.
var whiteListExtensions = [
  'html,htm,xhtml,xht', // markup
  'css,js',
  'jpeg,jpg,png,bmp,ico,gif,svg', // images
  'asp,aspx,cfm,cgi,jsp,php,py', // dynamic pages
  'json,atom,xml,rss', // feeds, data
  'ogg,flv,mkv,m4v,mov', // audio, video
  'woff,ttf,eot', // fonts
].join(',');

// whiteList.test(filename) returns true if the filename has one of the above extensions.
var whiteList = new RegExp('[^/]+.(' + whiteListExtensions.replace(/,/g, '|') + ')$');


/* For `dirname` and every directory name that is a subdirectory of `dirname`,
 * call `callback` with that directory name.
 */
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
    if (event === 'change' && whiteList.test(filename)) {
      console.log('Change detected:', filename);
      // there's no built-in 'end' event, so we emit it ourselves. some cleanup
      // code listens for this event
      res.emit('end');
      // Wait for things to settle before telling the browser to reload.  I do
      // not yet understand why this is necessary; without it, the browser
      // sometimes produces a file-not-found condition when reloading. I'd like
      // to understand this better so that we can have a 'more correct' way of
      // knowing when it is safe to send the reload signal to the browser.
      setTimeout(function () {
        res.end();
      }, 100);
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


var refreshingView = function (req, res) {
  var pathname = url.parse(req.url, true).query.path;
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

var makeEmptyView = function (statusCode) {
  return function (req, res) {
    res.statusCode = statusCode;
    res.end();
  };
};

var empty200View = makeEmptyView(200);
var empty404View = makeEmptyView(404);

var pathToView =
  { '/favicon.ico': empty404View
  , '/ping/': empty200View
  , '/watch/': refreshingView
  };


http.createServer(function (req, res) {
  var reqURL = url.parse(req.url);
  var pathname = reqURL.pathname;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;

  var view  = pathToView[pathname] || empty404View;
  view(req, res);

}).listen(7053, '127.0.0.1');
