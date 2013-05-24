var GifLib = require('gif');
//var rfb = require('./vnc/rfbclient');
var rfb = require('rfb2');
var url = require('url');

var http = require('http');
http.createServer(function(req, res) {
  var params = url.parse(req.url, true);
  if (params.pathname == '/screen.gif') {
    var connectArgs = {
      host: params.query.host || 'localhost',
      port: params.query.port ? parseInt(params.query.port,10) : 5900,
      password: params.query.password || ''
    };
    var r = rfb.createConnection(connectArgs);
    var gif;
    r.on('connect', function() {
      res.writeHead(200, { 'Content-Type': 'image/gif'});
      gif = new GifLib.AnimatedGif(r.width, r.height);
      gif.setOutputCallback(res.write.bind(res));
    });
    r.on('rect', function(rect) {
      // todo: use BGRA buffer type in gif constructor (does not work for me for some reason)
      var rgb = new Buffer(rect.width*rect.height*3);
      var offset = 0;
      for (var i=0; i < rect.buffer.length; i += 4) {
        rgb[offset++] = rect.buffer[i+2];
        rgb[offset++] = rect.buffer[i+1];
        rgb[offset++] = rect.buffer[i];
      }
      gif.push(rgb, rect.x, rect.y, rect.width, rect.height, 'rgb');
      gif.endPush();

      // send on vnc disconnect?
      // gif.end();
    });
    r.on('error', function(err) {
      console.error(err);
      res.writeHead(502, { 'Content-Type': 'text/plain'});
      res.end(err);
    });

  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(process.env.PORT || 4444);
