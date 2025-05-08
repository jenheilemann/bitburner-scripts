# Bitburner
Scripts for [Bitburner](https://danielyxie.github.io/bitburner/).

## If you're starting BitBurner and want all the Codez

Hi! Welcome, please look around. You are absolutely welcome and free to copy/paste, fork, splat, or whatever. The initial startup script and copy-paste instructions below I borrowed from https://github.com/moriakaice/bitburner/tree/master. That repo (at the time of this edit) doesn't work out of the box, but they're trying to be pretty new-player friendly. I recommend checking it out.

This repo.... is not especially new-player-friendly. If you want to take my repo whole-hog and run it in your own game (following the instructions below), it is unlikely to work unless you've been playing for a while. I started this repo primarily for myself, and the code makes some assumptions about certain features that are not available to new players. I also assume that there is at least 32GB of ram on your home computer, which is not immediately available to new players.

Also, be aware, I am not primarily a Javascript programmer, though it is something I enjoy playing with. I don't follow best practices in the industry for this language. If somebody says that the way I did something was *not good*, it probably is *not good* and trust other resources before you trust my code for `the best way` if you're learning.

Good luck, and have fun out there.

### WARNINGS

* This is an unstable repo. I regularly push untested code. I'm a rebel, I know.
* **This is an unstable repo.** I change method signatures for the hell of it. Depend on nothing.
* I'm a flake. If I haven't commited in a few weeks, it probably means I'm bored or got stuck and found something else to play with.
* This **does not work for new players**. This repo uses methods that are locked behind game mechanics.
* This contains spoilers. If you don't like spoilers, well... I warned you.

## Installation

Paste `wget https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/main/src/startup/initStartup.js startup/initStartup.js; run startup/initStartup.js`

## My aliases

```js
// startup everything. If you've run this at least once and want to skip
// downloading/overwriting files, do `run startup/run.js` instead
alias start="run start.js"

// run arbitrary ns processes and helper functions, see doProcess for examples
alias do="run doProcess.js"

// connect to any server by name
alias find="run usr/find.js"

// connect to any server by name
alias monitor="run monitor.js"

// get server data about what the best server to hack might be right now
alias best="run bestHack.js"

// manipulate localStorage
alias get="run usr/lsGet.js"
alias set="run usr/lsSet.js"

// force crime.js/workForFactions.js to stop, so you can play in-game
alias working="run usr/lsSet.js working"
alias done="run usr/lsClear.js working"

// set a reserve amount manually, above reseved money for buying programs
alias reserve="run usr/lsSet.js reserve"

// copy-paste-able lines
alias start="run start.js";alias do="run doProcess.js";alias find="run usr/find.js";
alias best="run bestHack.js --tail";alias get="run usr/lsGet.js";
alias set="run usr/lsSet.js";alias working="run usr/lsSet.js working";
alias done="run usr/lsClear.js working";alias reserve="run usr/lsSet.js reserve";
alias monitor="run monitor.js"; alias hoem="home";
alias bqueue="run usr/lsGet.js BATCHES"
```
