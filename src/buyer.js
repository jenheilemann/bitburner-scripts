import { fetchServer } from 'network.js'
import { waitForCash,
         clearLSItem,
         setLSItem,
         getNsDataThroughFile as fetch,
         disableLogs,
         announce,
        } from 'helpers.js'
const argsSchema = [
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
  let hostname, host

  const ram = Math.pow(2, args.size)
  const limit = await fetch(ns, `ns.getPurchasedServerLimit()`)
  const cost = await fetch(ns, `ns.getPurchasedServerCost(${ram})`)
  ns.tprint("Buying " + ram + "GB RAM servers")
  ns.tprint(`${limit} servers for ${ns.nFormat(cost, "$0.000a")} each`)
  let count = 0

  for (let i = 0; i < limit; i++) {
    hostname = "pserv-" + i
    count += await buyNewOrReplaceServer(ns, hostname, cost, ram)
    await ns.sleep(2000)
  }
  let msg = `Buyer.js is finished, purchased ${count} size ${args.size} servers.`
  announce(ns, msg)
  ns.tprint(msg)
  ns.tprint("I've bought all the servers I can. It's up to you now.")
}

/**
 * @param {NS} ns
 * @param {string} hostname
 * @param {number} cost
 * @param {number} ram
 */
async function buyNewOrReplaceServer(ns, hostname, cost, ram) {
  let host = await fetchServer(ns, hostname)
  if (host === null || host === undefined) {
    ns.print(`Buying a new server ${hostname} with ${ram} GB ram for ` +
      `${ns.nFormat(cost, "$0.000a")}`)
    await purchaseNewServer(ns, hostname, cost, ram)
    return 1
  }

  if (host.maxRam >= ram) {
    ns.print(`${hostname} is large enough, with ${host.maxRam} GB ram`)
    return 0
  }
  
  ns.print(`Upgrading ${hostname} with ${host.maxRam} -> ${ram} GB ram` +
    ` for ${ns.nFormat(cost, "$0.000a")}`)
  await upgradeServer(ns, host, cost, ram)
  return 1
}

/**
 * @param {NS} ns
 * @param {string} hostname
 * @param {number} cost
 * @param {number} ram
 */
async function purchaseNewServer(ns, hostname, cost, ram) {
  await waitForCash(ns, cost)
  await fetch(ns, `ns.purchaseServer('${hostname}', ${ram})`)
  clearLSItem('nmap')
}

/**
 * @param {NS} ns
 * @param {object} host
 * @param {number} cost
 * @param {number} ram
 */
async function upgradeServer(ns, host, cost, ram) {
  setLSItem('decommissioned', host.name)
  await waitForCash(ns, cost)
  ns.print("Waiting for scripts to end on " + host.name)
  await wrapUpProcesses(ns, host.name)
  await ns.sleep(50)
  ns.print("Destroying server: " + host.name)
  await fetch(ns, `ns.deleteServer('${host.name}')`)
  await fetch(ns, `ns.purchaseServer('${host.name}', ${ram})`)
  clearLSItem('decommissioned')
  clearLSItem('nmap')
}

/**
 * @param {NS} ns
 * @param {string} hostname
 */
async function wrapUpProcesses(ns, hostname) {
  while ( ns.ps(hostname).length > 0 ) {
    await ns.sleep(200)
  }
}
