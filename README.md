vnc-over-gif
============

Serves screen updates as animated gif over http.
Based on [node-gif](https://github.com/pkrumins/node-gif) by Peteris Krumins and [node-rfb2](https://github.com/sidorares/node-rfb2)

## Requirements

  - running vnc server
  - node 0.8 (see [issue #2](https://github.com/sidorares/vnc-over-gif/issues/2))
  - netscape 2.0+

## Installation

    npm install -g vnc-over-gif

## Usage

start server:

    $> PORT=4455 vnc-over-gif

open url in the browser - [http://localhost:4455/screen.gif?host=localhost&port=5900&password=secret](http://localhost:4455/screen.gif?host=localhost&port=5900&password=secret)

## FAQ

[Here](https://github.com/sidorares/vnc-over-gif/wiki/FAQ)

## Links

[HN discussion](https://news.ycombinator.com/item?id=5763183)

Inspired by [this tweet](https://twitter.com/tmm1/status/336810488631554049)

[Animated gif as data transport](https://github.com/videlalvaro/gifsockets)

[Animated gif binary format](http://www.matthewflickinger.com/lab/whatsinagif/animation_and_transparency.asp)

JS-only gif encoding libraries: [gif.js](https://github.com/jnordberg/gif.js), [omggif](https://github.com/deanm/omggif)
