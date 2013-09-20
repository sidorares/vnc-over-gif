var omggif = require('./omggif.js');
var NeuQuant = require('./neu_quant.js');

// TODO: make it actually a stream

function GifStream(w, h) {
  // HACK: I re-use omggif buffer and hope that 1024 + w*h is enough 
  // i expect (header + compressed pixels) to be less than uncompressed bitmap
  this.buf = new Buffer(1024 + w*h);
  this.encoder = new omggif.GifWriter(this.buf, w, h); //, { palette: webpalette, transparent: 255 });
}

GifStream.prototype.addFrame = function(x, y, w, h, data) {
  var quality = 1;
  var rgb_idx = 0;
  var rgb = new Buffer(w*h*3);
  for(var i=0; i < data.length; i+= 4) {
    rgb[rgb_idx++] = data[i + 0];
    rgb[rgb_idx++] = data[i + 1];
    rgb[rgb_idx++] = data[i + 2];
  }
  var imgq = new NeuQuant(rgb, quality);
  imgq.buildColormap();
  var map = imgq.getColormap();
  var indexed = new Buffer(w*h);
  rgb_idx = 0;
  var r, g, b;
  for (var i=0; i < indexed.length; ++i) {
     r = rgb[rgb_idx++];
     g = rgb[rgb_idx++];
     b = rgb[rgb_idx++];
     indexed[i] = imgq.lookupRGB(r, g, b);
  }
  var palette = new Array(map.length/3);
  var map_idx = 0;
  for (var i=0; i < palette.length; ++i) {
    palette[i] = 
      (map[map_idx + 0] <<  0) +
      (map[map_idx + 1] <<  8) +
      (map[map_idx + 2] << 16);
    map_idx += 3;
  }
  this.encoder.addFrame(x, y, w, h, indexed, {delay: 1, palette: palette});
  return this.encoder.read();
};

module.exports = GifStream;
