import { getNsDataThroughFile as fetch,
         disableLogs,
         announce,
         formatRam,
        } from 'utils/helpers.js'
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
  // ns.ui.openTail()

  const ram = 2**args.size
  const limit = await fetch(ns, `ns.getPurchasedServerLimit()`,
    `/Temp/getPurchasedServerLimit.txt`)
  const cost = await fetch(ns, `ns.getPurchasedServerCost(${ram})`,
    `/Temp/getPurchasedServerCost.${args.size}.txt`)
  ns.print(`Buying ${limit} ${ram}GB servers for ${ns.formatNumber(cost)} each`)
  let count = 0

  let hostname
  for (let i = 0; i < limit; i++) {
    hostname = "pserv-" + i
    count += await buyNewOrReplaceServer(ns, hostname, cost, ram)
  }
  let msg = `PServBuyer.js is finished, purchased ${count} size ${args.size} servers.`
  announce(ns, msg, 'success')
  ns.tprint("SUCCESS: " + msg)
}

/**
 * @param {NS} ns
 * @param {string} hostname
 * @param {number} cost
 * @param {number} ram
 */
async function buyNewOrReplaceServer(ns, hostname, cost, ram) {
  if (!ns.serverExists(hostname)) {
    ns.print(`Buying a new server ${hostname} with ${ram} GB ram for ` +
      `${ns.formatNumber(cost)}`)
    return purchaseNewServer(ns, hostname, ram)
  }
  let host = await fetch(ns, `ns.getServer('${hostname}')`)

  if (host.maxRam >= ram) {
    ns.print(`${hostname} is large enough, with ${host.maxRam} GB ram`)
    return 0
  }

  ns.print(`Upgrading ${hostname} with ${host.maxRam} -> ${ram} GB ram` +
    ` for \$${ns.formatNumber(cost)}`)
  return await upgradeServer(ns, host, ram)
}

/**
 * @param {NS} ns
 * @param {string} hostname
 * @param {number} ram
 */
async function purchaseNewServer(ns, hostname, ram) {
  let result = await fetch(ns, `ns.purchaseServer('${hostname}', ${ram})`,
    `/Temp/purchaseServer.txt`)
  if (result) {
    announce(ns, `Purchased new server, ${hostname} with ${formatRam(ram)}`)
    return 1
  }
  return 0
}

/**
 * @param {NS} ns
 * @param {Server} server
 * @param {number} ram
 */
async function upgradeServer(ns, server, ram) {
  ns.print("Upgrading server: " + server.hostname)
  const result = ns.upgradePurchasedServer(server.hostname, ram)

  if (result) {
    announce(ns, `Upgraded server ${server.hostname} with ${formatRam(ram)}`)
    return 1
  }
  return 0
}

