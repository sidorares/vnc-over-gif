vnc-over-gif
============

Serves screen updates as animated gif over http.
Based on [node-gif](https://github.com/pkrumins/node-gif) by Peteris Krumins and [node-rfb2](https://github.com/sidorares/node-rfb2)

## Installation

    npm install -g vnc-over-gif

## Usage

start server:

    $> PORT=4455 vnc-over-gif

open url in the browser - [http://localhost:4455/screen.gif?host=localhost&port=5900&password=secret](http://localhost:4455/screen.gif?host=localhost&port=5900&password=secret)

## Links

https://twitter.com/tmm1/status/336810488631554049

https://github.com/videlalvaro/gifsockets

http://www.matthewflickinger.com/lab/whatsinagif/animation_and_transparency.asp
