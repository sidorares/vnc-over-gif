#!/usr/bin/env node

var GifLib = require('gif');
// NOTE: gif module currently doesn't install, see workaround: https://github.com/sidorares/vnc-over-gif/issues/5
//var GifLib = require('/path-to-manually-compiled/node-gif/build/Release/obj.target/gif.node');
var rfb = require('rfb2');
var url = require('url');
var http = require('http');
var fs = require('fs');
var path = require('path');
var swig = require('swig');
var formidable = require('formidable');

var r = null;

http.createServer(function(req, res) {
  var params = url.parse(req.url, true);

  if (params.pathname == '/jquery.js') { 
    respondWithFile(res, 'jquery.js', 'text/javascript'); 

  } else if (params.pathname == '/js.html') { 
    respondWithHtml(res, 'js.html', params); 

  } else if (params.pathname == '/update' && req.method.toUpperCase() == 'POST') {
    processUpdate(req, res, r); 

  } else if (params.pathname == '/screen.gif') {
    var args = {
      host: params.query.host || 'localhost',
      port: params.query.port ? parseInt(params.query.port,10) : 5900,
      password: params.query.password || ''
    };
    r = rfb.createConnection(args);
    var gif;
  
    r.on('connect', function() {
      res.writeHead(200, { 'Content-Type': 'image/gif' });
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
      gif.push(rgb, rect.x, rect.y, rect.width, rect.height);
      gif.endPush();

      // send on vnc disconnect?
      // gif.end();
    });
    r.on('error', function(err) {
      console.error(err);
      res.writeHead(502, { 'Content-Type': 'text/plain'});
      if (typeof(err) == 'string') {
        res.end(err);
      } else if (err instanceof Error) {
        res.end(err.message);
      } else {
        res.end('unknown error:' + JSON.stringify(err));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(process.env.PORT || 4444);

var respondWithFile = function(res, filename, contentType) {
  var stat   = fs.statSync(filename);
  var stream = fs.createReadStream(filename);
  res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stat.size });
  stream.pipe(res);
};

var respondWithHtml = function(res, filename, params) {
  var search = (params.search || '');
  var html   = swig.compileFile(path.resolve(__dirname, filename)).render({ query: search });
  res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': Buffer.byteLength(html, 'utf8') });
  res.write(html);
  res.end();
};

var processUpdate = function(req, res, r) {
  if (r) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields) {
      if (!err) {
        //console.log(fields);
        switch(fields.event) {
        case 'mouse':
          r.pointerEvent(fields.x, fields.y, fields.buttonState);
          break;
        case 'keyboard':
          r.keyEvent(fields.keyCode, fields.isDown);
          break;
        case 'clipboard':
          r.clipboardUpdate(fields.text);
          break;
        default: 
          res.writeHead(400);
          res.end("unrecognised event '"+fields.event+"'");
          return;
        }
        res.writeHead(200);
        res.end();
      } else {
        res.writeHead(400);
        res.end();
      }
    });
  }
};