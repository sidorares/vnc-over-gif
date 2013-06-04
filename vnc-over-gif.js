#!/usr/bin/env node

var GifLib = require('gif');
// NOTE: gif module currently doesn't install, see workaround: https://github.com/sidorares/vnc-over-gif/issues/5
//var GifLib = require('/home/mike/dev/vnc/node-gif/build/Release/obj.target/gif.node');
var rfb = require('rfb2');
var url = require('url');
var http = require('http');
var fs = require('fs');
var path = require('path');
var swig = require('swig');
var cookie = require('cookie');

var sessions = {};

http.createServer(function(req, res) {
  var params = url.parse(req.url, true);

  if (params.pathname == '/jquery.js') { 
    respondWithFile(res, 'jquery.js', 'text/javascript'); 

  } else if (params.pathname == '/js.html') { 
    var sessionid = uuid();
    sessions[sessionid] = null;
    respondWithHtml(res, 'js.html', sessionid, params); 

  } else if (params.pathname == '/update' && req.method == 'POST') {
    var body = '';
    req.on('data', function(chunk) { 
      body += chunk.toString(); 
    });
    req.on('end', function() {
      var sessionid = (req.headers['cookie'] ? cookie.parse(req.headers['cookie'])['sessionid'] : null);
      var updates   = null;
      if (req.headers['content-type'] == 'application/json') {
        if (sessionid && (sessionid in sessions)) {
          try { updates = JSON.parse(body); } catch (e) { }
          if (updates && updates instanceof Array) {
            processUpdates(sessionid, updates);
            res.writeHead(200);
            res.end();
          } else {
            res.writeHead(400, { 'Content-Type': 'text/plain'});
            res.end("malformed update request");
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain'});
          res.end("missing session cookie or session doesn't exist");
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain'});
        res.end("update request must contain json");
      }
    });

  } else if (params.pathname == '/screen.gif') {
    var sessionid = (req.headers['cookie'] ? cookie.parse(req.headers['cookie'])['sessionid'] : null);
    var args = {
      host: params.query.host || 'localhost',
      port: params.query.port ? parseInt(params.query.port,10) : 5900,
      password: params.query.password || ''
    };
    var r = rfb.createConnection(args);
    var gif;

    if (sessionid && (sessionid in sessions)) sessions[sessionid] = r;
  
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

var uuid = function(a) {
  return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid);
};

var respondWithFile = function(res, filename, contentType) {
  var stat   = fs.statSync(filename);
  var stream = fs.createReadStream(filename);
  res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stat.size });
  stream.pipe(res);
};

var respondWithHtml = function(res, filename, sessionid, params) {
  var search    = (params.search || '');
  var html      = swig.compileFile(path.resolve(__dirname, filename)).render({ query: search });
  res.writeHead(200, { 
    'Content-Type':   'text/html', 
    'Content-Length': Buffer.byteLength(html, 'utf8'),
    'Set-Cookie':     cookie.serialize('sessionid', sessionid) 
  });
  res.write(html);
  res.end();
};

var processUpdates = function(sessionid, updates) {
  var r = sessions[sessionid];
  if (r) {
    console.log(updates);
    updates.forEach(function(update) {
      switch (update.event) {
      case 'mouse':
        r.pointerEvent(update.x, update.y, update.buttonState);
        break;
      case 'keyboard':
        r.keyEvent(update.keyCode, update.isDown);
        break;
      case 'clipboard':
        r.clipboardUpdate(update.text);
        break;
      default: 
        console.log("ignoring unrecognised update: '"+update.event+"'");
      }
    });
  }
};