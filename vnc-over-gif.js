#!/usr/bin/env node
var rfb = require('rfb2');
var GifStream = require('./lib/stream.js');

require('http').createServer(function(req, res) {
  var params = require('url').parse(req.url, true);
  if (params.pathname == '/screen.gif') {
    var r = rfb.createConnection(params.query);
    var gif;

    r.on('connect', function() {
      res.writeHead(200, { 'Content-Type': 'image/gif'});
      
      gif = new GifStream(r.width, r.height);
      //gif.pipe(res);
      
      r.on('rect', function(rect) {
        var data = gif.addFrame(rect.x, rect.y, rect.width, rect.height, rect.data);
        r.requestUpdate(true, 0, 0, r.width, r.height);
        res.write(data);
      });
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(process.env.PORT || 4444, '0.0.0.0');
