/**
 * @param {NS} ns
 **/
export async function main(ns) {
  var target = ns.args[0]
  var toHack = ns.args[1]

  // copy the get-money script to the target
  var script = "get-money.script"
  ns.scp(script, "home", target);
  ns.print("Copied " + script + " to " + target)

  // calculate the threads we can use for running our script
  var ramRequired = ns.getScriptRam(script);
  var availableRam = ns.getServerMaxRam(target) - ns.getServerUsedRam(target);
  ns.print(target + " has " + availableRam + " ram available to use")
  var threads = Math.min(50, Math.floor(availableRam / ramRequired))

  if (threads < 1) {
    ns.print("No ram available")
    ns.exit()
  }

  ns.print("Using " + threads + " threads")

  var pid = ns.exec(script, target, threads, toHack, loud);
  ns.print("Running script on " + target + " with PID " + pid)
}
