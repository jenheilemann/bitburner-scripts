import { BestHack } from 'bestHack.js'
import { networkMap, fetchServer } from 'network.js'
import { toolsCount,
         waitForCash,
         fetchPlayer,
         clearLSItem,
         disableLogs } from 'helpers.js'
import { root } from 'rooter.js'

export function autocomplete(data, args) {
  return data.servers
}

const script = "breadwinner.js"

async function findTarget(ns, target) {
  if (target != 'dynamic') {
    return await fetchServer(ns, target)
  }
  const searcher = new BestHack(await networkMap(ns))
  const player = fetchPlayer()
  return searcher.findBestPerLevel(player, toolsCount())
}

export async function main(ns) {
  disableLogs(ns, ['getServerMoneyAvailable', 'sleep'])

  const args = ns.flags([
    ['target', 'dynamic'],
    ['size', 7],
  ])

  let target, hostname, host, threads
  const ram = Math.pow(2, args.size)
  const limit = ns.getPurchasedServerLimit()
  const cost = ns.getPurchasedServerCost(ram)
  const ramRequired = ns.getScriptRam(script)
  ns.tprint("Buying " + ram + "GB RAM servers")
  ns.tprint("Buying " + limit + " servers for " + ns.nFormat(cost, "$0.000a") + " each")

  for (let i=0; i < limit; i++) {
    hostname = "pserv-" + i
    host = await fetchServer(ns, hostname)
    if ( host === undefined ) {
      await waitForCash(ns, cost)
      ns.purchaseServer(hostname, ram)
      clearLSItem('nmap')
    } else {
      if ( host.maxRam < ram ) {
        await waitForCash(ns, cost)
        ns.print("Destroying server: " + hostname)
        ns.scriptKill(script, hostname)
        ns.deleteServer(hostname)
        ns.purchaseServer(hostname, ram)
        clearLSItem('nmap')
      } else {
        ns.scriptKill(script, hostname)
      }
    }

    host = await fetchServer(ns, hostname)
    target = await findTarget(ns, args.target)

    ns.print("Targeting " + target.name + ", ensuring sudo first.")
    root(ns, target)

    await ns.scp(script, hostname)
    threads = Math.floor( host.maxRam / ramRequired)
    ns.exec(script, hostname, threads, target.name, threads)
    await ns.sleep(2000)
  }
  ns.tprint("I've bought all the servers I can. It's up to you now.")
}
