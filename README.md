# Bitburner
Scripts for [Bitburner](https://danielyxie.github.io/bitburner/).

## If you're starting BitBurner and want all the Codez

Hi! Welcome, please look around. You are absolutely welcome and free to copy/paste, fork, splat, or whatever. The initial startup script and copy-paste instructions below I borrowed from https://github.com/moriakaice/bitburner/tree/master. That repo (at the time of this edit) doesn't work out of the box, but they're trying to be pretty new-player friendly. I recommend checking it out.

This repo.... is not especially new-player-friendly. If you want to take my repo whole-hog and run it in your own game (following the instructions below), it is unlikely to work unless you've been playing for a while. I started this repo primarily for myself, and the code makes some assumptions about certain features that are not available to new players. I also assume that there is at least 64GB of ram on your home computer (I probably need to fix, that's a bad assumption...), which is certainly not available to new players.

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

Save and exit nano and write in console: `run start.js`
