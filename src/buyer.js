import { BestHack } from 'bestHack.js'
import { networkMap, fetchServer } from 'network.js'
import { waitForCash,
         clearLSItem,
         getNsDataThroughFile as fetch,
         disableLogs } from 'helpers.js'
const scripts = ['hack.js', 'grow.js', 'weaken.js']
const argsSchema = [
  ['target', 'dynamic'],
  ['size', 7],
]

export function autocomplete(data, args) {
  data.flags(argsSchema)
  return data.servers
}

/**
 * @param {NS} ns
 */
export async function main(ns) {
  disableLogs(ns, ['getServerMoneyAvailable', 'sleep'])
  const args = ns.flags(argsSchema)
  let target, hostname, host, threads

  const ram = Math.pow(2, args.size)
  const limit = await fetch(ns, `ns.getPurchasedServerLimit()`)
  const cost = await fetch(ns, `ns.getPurchasedServerCost(${ram})`)
  ns.tprint("Buying " + ram + "GB RAM servers")
  ns.tprint(`${limit} servers for ${ns.nFormat(cost, "$0.000a")} each`)

  for (let i = 0; i < limit; i++) {
    hostname = "pserv-" + i
    host = await fetchServer(ns, hostname)
    if (host === null || host === undefined) {
      ns.print(`Buying a new server ${hostname} with ${ram} GB ram for ` +
        `${ns.nFormat(cost, "$0.000a")}`)
      await waitForCash(ns, cost)
      await fetch(ns, `ns.purchaseServer('${hostname}', ${ram})`)
      clearLSItem('nmap')
    } else {
      if (host.maxRam < ram) {
        ns.print(`Upgrading ${hostname} with ${host.maxRam} -> ${ram} GB ram` +
          ` for ${ns.nFormat(cost, "$0.000a")}`)
        await waitForCash(ns, cost)
        ns.print("Destroying server: " + hostname)
        await fetch(ns, `ns.deleteServer('${hostname}')`)
        await fetch(ns, `ns.purchaseServer('${hostname}', ${ram})`)
        clearLSItem('nmap')
      } else {
        ns.print(`${hostname} is large enough, with ${host.maxRam} GB ram`)
      }
    }
    await ns.sleep(2000)
  }
  ns.tprint("I've bought all the servers I can. It's up to you now.")
}
