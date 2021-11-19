# Bitburner
Scripts for [Bitburner](https://danielyxie.github.io/bitburner/).

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

Exit the nano and write in console: `run start.js`
