import { fetchServerFree } from 'network.js'
import { getNsDataThroughFile as fetch } from 'helpers.js'
const script = 'breadwinner.js'

export function autocomplete(data, args) {
  return data.servers
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  var target = await fetchServerFree(ns.args[0])
  var toHack = ns.args[1]

  // copy the scripts to the target
  await fetch(ns, `ns.scp(${script}, "home", ${target.name})`)
  ns.print(`Copied ${script} to ${target.name}`)

  // calculate the threads we can use for running our script
  var ramRequired = await fetch(ns, `ns.getScriptRam(${script})`)
  var availableRam = target.maxRam - target.data.ramUsed
  ns.print(`${target.name} has ${availableRam} ram available to use`)
  var threads = Math.floor(availableRam / ramRequired)

  if (threads < 1) {
    ns.tprint(`No ram available to run ${script} on ${target.name} ` +
      `(${availableRam}/${ramRequired})`)
    return
  }

  ns.print("Using " + threads + " threads")

  var pid = await fetch(ns, `ns.exec('${script}', '${target.name}', ${threads}, '${toHack}', ${threads})` )
  ns.print(`Running script on ${target.name} with PID ${pid}`)
}
