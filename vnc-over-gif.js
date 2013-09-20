#!/usr/bin/env node
var rfb = require('rfb2');
var GifStream = require('./lib/stream.js');

var FRAME_RATE = 100; // minimum update interval

// calculate update rectangle
function screenDiff(screen1, screen2, w, h) {

  var topLeft = [w, h];
  var bottomRight = [-1, -1];

  var screen_idx;
  for (var y = 0; y < h; ++y) {
    for (var x = 0; x < w; ++x) {
      screen_idx = (x + y*w)*3;
      if (!(
        screen1[screen_idx + 0] == screen2[screen_idx + 0] &&
        screen1[screen_idx + 1] == screen2[screen_idx + 1] &&
        screen1[screen_idx + 2] == screen2[screen_idx + 2]
      )) {
        if (x < topLeft[0])
          topLeft[0] = x;
        if (y < topLeft[1])
          topLeft[1] = y;
        if (x > bottomRight[0])
          bottomRight[0] = x;
        if (y > bottomRight[1])
          bottomRight[1] = y;
      }
    }
  }

  var rect = {
    x: topLeft[0],
    width: bottomRight[0] - topLeft[0],
    y: topLeft[1],
    height: bottomRight[1] - topLeft[1]
  };

  if (rect.width <= 0 || rect.height <= 0)
    return null;

  var screen_idx, rect_idx;
  rect.data = new Buffer(rect.width*rect.height*3);
  for(var y=rect.y; y < rect.y + rect.height; ++y) {
    for(var x=rect.x; x < rect.x + rect.width; ++x) {
      screen_idx = (x + y*w)*3;
      rect_idx = ((y-rect.y)*rect.width + x - rect.x)*3;
      rect.data[rect_idx + 0] = screen2[screen_idx + 0];
      rect.data[rect_idx + 1] = screen2[screen_idx + 1];
      rect.data[rect_idx + 2] = screen2[screen_idx + 2];
    }
  }
  return rect;
}

// copy 32 bit rect to 24 bit screen
function drawRect(screen, w, h, rect) {
  var screen_idx, rect_idx;
  for(var y=rect.y; y < rect.y + rect.height; ++y) {
    for(var x=rect.x; x < rect.x + rect.width; ++x) {
      screen_idx = (x + y*w)*3;
      rect_idx = ((y-rect.y)*rect.width + x - rect.x)*4;
      screen[screen_idx + 0] = rect.data[rect_idx + 0]; 
      screen[screen_idx + 1] = rect.data[rect_idx + 1]; 
      screen[screen_idx + 2] = rect.data[rect_idx + 2]; 
    }
  }
}

require('http').createServer(function(req, res) {
  var params = require('url').parse(req.url, true);
  if (params.pathname == '/screen.gif') {
    var r = rfb.createConnection(params.query);
    var gif;
    var screenSent, screenCurrent;

    r.on('connect', function() {
      res.writeHead(200, { 'Content-Type': 'image/gif'});
      
      gif = new GifStream(r.width, r.height);
      screenSent    = new Buffer(r.width*r.height*3);
      screenCurrent = new Buffer(r.width*r.height*3);

      var lastUpdateTime = +Date.now();
      function sendUpdate() {
        if (Date.now() - lastUpdateTime < FRAME_RATE)
          return;
        var rect = screenDiff(screenSent, screenCurrent, r.width, r.height);
        if (rect) {
          var data = gif.addFrame(rect.x, rect.y, rect.width, rect.height, rect.data);
          console.log(data.length);
          res.write(data);
        }
        screenCurrent.copy(screenSent);
        lastUpdateTime = +Date.now();
      }

      r.on('rect', function(rect) {
        drawRect(screenCurrent, r.width, r.height, rect);
        r.requestUpdate(true, 0, 0, r.width, r.height);
        sendUpdate();
      });

    });
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(process.env.PORT || 4444, '0.0.0.0');
