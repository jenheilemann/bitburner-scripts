import { BestHack } from 'bestHack.js'
import { networkMap } from 'network.js'
import { toolsCount, waitForCash } from 'helpers.js'
import { root } from 'rooter.js'

const script = "breadwinner.js"

function findTarget(ns, target, searcher) {
  if (target != 'dynamic') {
    return target
  }
  return searcher.findBestPerLevel(ns, ns.getHackingLevel(), toolsCount(ns)).name
}

export async function main(ns) {
  ns.disableLog('getServerMoneyAvailable')
  ns.disableLog('sleep')

  const args = ns.flags([
    ['destroy', false],
    ['target', 'dynamic'],
    ['size', 7],
  ])
  const ram = Math.pow(2, args.size)

  ns.tprint("Buying " + ram + "GB RAM servers")

  const limit = ns.getPurchasedServerLimit()
  const cost = ns.getPurchasedServerCost(ram)
  ns.tprint("Buying " + limit + " servers for " + ns.nFormat(cost, "$0.000a") + " each")

  const ramRequired = ns.getScriptRam(script)
  const searcher = new BestHack(await networkMap(ns))
  const pServs = ns.getPurchasedServers()

  let target, hostname, threads

  for (let i=0; i < limit; i++) {
    hostname = "pserv-" + i
    if (!ns.serverExists(hostname)) {
      await waitForCash(ns, cost)
      ns.purchaseServer(hostname, ram)
    } else {
      ns.scriptKill(script, hostname)
      if (args['destroy']) {
        ns.print("Destroying server: " + hostname)
        ns.deleteServer(hostname)
        await waitForCash(ns, cost)
        ns.purchaseServer(hostname, ram)
      }
    }

    target = findTarget(ns, args.target, searcher)
    ns.print("Targeting " + target + ", ensuring sudo first.")
    root(ns, target)
    await ns.scp(script, hostname);
    threads = Math.floor(ns.getServerMaxRam(hostname) / ramRequired)
    ns.exec(script, hostname, threads, target)
    await ns.sleep(2000)
  }
  ns.tprint("I've bought all the servers I can. It's up to you now.")
}
