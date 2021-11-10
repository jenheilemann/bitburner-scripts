import { networkMap } from 'network.js'
import { groupBy } from 'groupBy.js'
import { BestHack } from 'bestHack.js'
import { toolsCount, tryRun, rootFiles } from 'helpers.js'
import { root } from 'rooter.js'

const crackers = [0].concat(rootFiles)

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let nMap = networkMap(ns)
  ns.disableLog('sleep')

  const serversByPortsRequired = groupBy(Object.values(nMap), (s) => s.portsRequired)
  const searcher = new BestHack(nMap)
  let target, waitTime;

  for (let i = 0; i < crackers.length; i++) {
    if (i > 0) {
      ns.print("Waiting for the next cracking tool...")
      do {
        await ns.sleep(10000)
      } while (!ns.fileExists(crackers[i].name, 'home'));
    }

    target = searcher.findBestPerLevel(ns, ns.getHackingLevel(), toolsCount(ns))
    root(ns, target.name)

    ns.tprint("Zombifying level " + i + " servers, targeting " + target.name)
    for (let server of serversByPortsRequired[i]) {
      if (server.name !== 'home') {
        await zombify(ns, server, target.name)
        await ns.sleep(5000)
      }
    }

    // wait a sec for us to level up a little
    waitTime = ns.getWeakenTime(target.name)
    if ( i > 0 ) {
      // we're probably targeting something that'll take a while
      // and we're already leveling up anyway, so wait 1 min
      waitTime = 60 * 1000
    }
    ns.tprint(`Waiting ${ns.tFormat(waitTime)} to level up a little`)
    await ns.sleep(waitTime)
  }

  ns.tprint("Botnet.ns completed running. You have taken over the world! Mwahaha")
  await tryRun(ns, () => ns.run('/hacknet/startup.js', 1, 5) )
}

async function zombify(ns, serv, target) {
  root(ns, serv.name)
  let pid = await tryRun(ns, () => ns.run("zombifier.js", 1, serv.name, target))
  ns.tprint("Zombifying " + serv.name + " with PID " + pid)
}
