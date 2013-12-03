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

## Interactivity

Preliminary support has been added for keyboard and mouse interactivity.  To use, load the **js.html** file instead, like so:

[http://localhost:4455/js.html?host=localhost&port=5900&password=secret](http://localhost:4455/js.html?host=localhost&port=5900&password=secret)

* requires Javascript, US layout keyboards
* events (including keystrokes) are sent to the remote server only when the mouse cursor is over the GIF image (otherwise they're sent to the browser).
* browser-recognised keystrokes (like Ctrl-N, Ctrl-T, etc) will only be passed through by Firefox -- other browsers don't allow these to be overridden and will fire their usual browser actions.

## FAQ

[Here](https://github.com/sidorares/vnc-over-gif/wiki/FAQ)

## Links

[HN discussion](https://news.ycombinator.com/item?id=5763183)

Inspired by [this tweet](https://twitter.com/tmm1/status/336810488631554049)

[Animated gif as data transport](https://github.com/videlalvaro/gifsockets)

[Animated gif binary format](http://www.matthewflickinger.com/lab/whatsinagif/animation_and_transparency.asp)

JS-only gif encoding libraries: [gif.js](https://github.com/jnordberg/gif.js), [omggif](https://github.com/deanm/omggif)

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sidorares/vnc-over-gif/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
