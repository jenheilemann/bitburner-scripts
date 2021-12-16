/**
 * This is a clever little trick, if I do say so myself. Absolutely stole the
 * idea and most of the implementation from Insight on Discord, saw him doing
 * this on a stream and immediately needed it for myself.
 *
 * This allows you to run any arbitrary ns/js code from the terminal. E.g.:
 *
 *    run doProcess.js await ns.hack('n00dles'); ns.tprint('Hacked!')
 *
 * You can also alias it (alias do='run doProcess.js') for even more deliciousness:
 *
 *    do ns.ps('foodnstuff')
 **/

import {
          runCommand,
        } from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  // run the command in verbose mode, since that's usually what I want anyway
  await runCommand(ns, ns.args.join(" "), '/Temp/doThisProcess.js', true)
}
