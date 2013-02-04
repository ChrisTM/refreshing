'use strict';

// use the DOM to parse the URL (probably more robust than any regex)
var parseURL = function(url) {
  var a = document.createElement('a');
  a.href = url;
  return { protocol: a.protocol
         , host: a.host
         , hostname: a.hostname
         , port: a.port
         , pathname: a.pathname
         };
};
