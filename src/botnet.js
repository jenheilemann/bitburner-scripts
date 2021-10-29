import { networkMap } from 'network.js'
import { groupBy } from 'groupBy.js'
import { BestHack } from 'bestHack.js'
import { toolsCount } from 'rooter.js'

const crackers = [0, "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "sqlinject.exe"]

export async function main(ns) {
  let nMap = networkMap(ns)
  ns.disableLog('sleep')

  const serversByPortsRequired = groupBy(Object.values(nMap.serverData), (s) => s.portsRequired)
  const searcher = new BestHack(nMap.serverData)
  let target, hackTime;

  for (let i = 0; i < crackers.length; i++) {
    if (i > 0) {
      ns.print("Waiting for the next cracking tool...")
      do {
        await ns.sleep(10000)
      } while (!ns.fileExists(crackers[i], 'home'));
    }

    target = searcher.findBestPerLevel(ns.getHackingLevel(), toolsCount(ns))
    ns.tprint("Zombifying level " + i + " servers, targeting " + target.name)
    for (let server of serversByPortsRequired[i]) {
      if (server.name !== 'home') {
        zombify(ns, server, target.name)
        await ns.sleep(400)
      }
    }
    // wait a sec for us to level up at least once
    hackTime = ns.getHackTime(target.name)
    ns.tprint(`Waiting ${hackTime} seconds until the first hack has run, ${hackTime * 1000} milliseconds`)
    await ns.sleep(hackTime * 1000)
  }

  ns.tprint("Botnet.ns completed running. You have taken over the world! Mwahaha")
  ns.run('/hacknet/startup.js', 1, 6)
}

function zombify(ns, serv, target) {
  let pid = ns.run("zombie-server.script", 1, serv.name, target, 0)
  ns.tprint("Zombifying " + serv.name + " with PID " + pid)
}
