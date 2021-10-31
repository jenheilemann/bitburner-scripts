import { BestHack } from 'bestHack.js'
import { networkMap } from 'network.js'
import { toolsCount,waitForCash } from 'helpers.js'

const script = "get-money.script"

function findTarget(ns, target, searcher) {
  if ( target != 'dynamic' ) {
    return target
  }
  return searcher.findBestPerLevel(ns, ns.getHackingLevel(), toolsCount(ns)).name
}

export async function main(ns) {
  ns.disableLog('getServerMoneyAvailable')
  ns.disableLog('sleep')

  const args = ns.flags([
    ['destroy', false ],
    ['target', 'dynamic'],
    ['size', 7],
  ])
  const ram = Math.pow(2, args.size)

  ns.tprint("Buying " + ram + "GB RAM servers")

  const limit = ns.getPurchasedServerLimit();
  const cost = ns.getPurchasedServerCost(ram);
  ns.tprint("Buying " + limit + " servers for " + ns.nFormat(cost, "$0.000a") + " each")

  const ramRequired = ns.getScriptRam(script);
  const threads = Math.floor(ram / ramRequired)
  const searcher = new BestHack(networkMap(ns).serverData)
  const pServs = ns.getPurchasedServers()

  let i = 0;
  let target, hostname;

  while (i < limit) {
    await waitForCash(ns, cost);

    target = findTarget(ns, args.target, searcher)
    ns.print("Targeting " + target + ", ensuring sudo first.")
    ns.run("hack-server.script", 1, target, 0)

    hostname = "pserv-" + i
    if ( ! ns.serverExists(hostname) ) {
      ns.purchaseServer(hostname, ram);
    } else {
      ns.scriptKill(script, serv)
      if ( args['destroy'] ) {
        ns.print("Destroying server: " + hostname)
        ns.deleteServer(serv)
        ns.purchaseServer(hostname, ram);
      }
    }
    ns.scp(script, hostname);
    ns.exec(script, hostname, threads, target);
    ++i;
    await ns.sleep(2000)
  }
  ns.tprint("I've bought all the servers I can. It's up to you now.")
}
