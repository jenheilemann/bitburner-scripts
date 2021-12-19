# Bitburner
Scripts for [Bitburner](https://danielyxie.github.io/bitburner/).

## If you're starting BitBurner and want all the Codez

Hi! Welcome, please look around. You are absolutely welcome and free to copy/paste, fork, splat, or whatever. The initial startup script and copy-paste instructions below I borrowed from https://github.com/moriakaice/bitburner/tree/master. That repo (at the time of this edit) doesn't work out of the box, but they're trying to be pretty new-player friendly. I recommend checking it out.

This repo.... is not especially new-player-friendly. If you want to take my repo whole-hog and run it in your own game (following the instructions below), it is unlikely to work unless you've been playing for a while. I started this repo primarily for myself, and the code makes some assumptions about certain features that are not available to new players. I also assume that there is at least 32GB of ram on your home computer, which is not immediately available to new players.

Also, be aware, I am not primarily a Javascript programmer, though it is something I enjoy playing with. I don't follow best practices in the industry for this language. If somebody says that the way I did something was *not good*, it probably is *not good* and trust other resources before you trust my code for `the best way` if you're learning.

Good luck, and have fun out there.

## Installation

Create a new script called `start.js` by issuing the following command: `nano start.js`. Make sure you are on your home server; if you are not you can quickly go home by running `home` in the console.

Paste the following content:

```js
export async function main(ns) {
  if (ns.getHostname() !== "home") {
    throw new Exception("Run the script from home");
  }

  await ns.wget(
    `https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/main/src/initStartup.js?ts=${new Date().getTime()}`,
    "initStartup.js"
  );
  ns.spawn("initStartup.js", 1);
}
```

Save and exit nano and write in console: `run start.js` then press enter.

## My aliases

```js
// startup everything. If you've run this at least once and want to skip
// downloading/overwriting files, do `run startup/run.js` instead
alias start="run start.js"

// run arbitrary ns processes and helper functions, see doProcess for examples
alias do="run doProcess.js"

// connect to any server by name
alias find="run find.js"

// get server data about what the best server to hack might be right now
alias best="run bestHack.js"

// quickly tail the first personal server's moneymaking script
alias tail0="connect pserv-0; tail breadwinner.js; home"

// manipulate localStorage
alias get="run lsGet.js"
alias set="run lsSet.js"

// force crime.js/workForFactions.js to stop, so you can play in-game
alias working="run lsSet.js working"
alias done="run lsClear.js working"

// set a reserve amount manually, above reseved money for buying programs
alias reserve="run lsSet.js reserve"
```
