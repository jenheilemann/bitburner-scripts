import { fetchServerFree } from 'network.js'
const script = 'breadwinner.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  var target = await fetchServerFree(ns.args[0])
  var toHack = ns.args[1]

  // copy the scripts to the target
  await ns.scp(script, "home", target);
  ns.print("Copied " + script + " to " + target)

  // calculate the threads we can use for running our script
  var ramRequired = ns.getScriptRam(script);
  var availableRam = target.maxRam - target.data.ramUsed
  ns.print(target + " has " + availableRam + " ram available to use")
  var threads = Math.min(50, Math.floor(availableRam / ramRequired))

  if (threads < 1) {
    ns.print("No ram available")
    ns.exit()
    return;
  }

  ns.print("Using " + threads + " threads")

  var pid = ns.exec(script, target, threads, toHack, threads);
  ns.print("Running script on " + target + " with PID " + pid)
}
