import { networkMap } from 'Network.js'
import { groupBy } from 'groupBy.js'
import { BestHack } from 'BestHack.js'

export async function main(ns) {
  let nMap = networkMap(ns)
  let crackers = [0, "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "sqlinject.exe"]

  const serversByPortsRequired = groupBy(Object.values(nMap.serverData), (s) => s.portsRequired)
  const searcher = new BestHack(nMap.serverData)
  let target;

  for (let i = 0; i < crackers.length; i++) {
    if (i > 0) {
      do {
        await ns.sleep(10000)
      } while (!ns.fileExists(crackers[i], 'home'));
    }

    let target = searcher.findBestPerLevel(ns.getHackingLevel())
    ns.tprint("Zombifying level " + i + " servers, targeting " + target)
    for (const server of serversByPortsRequired[i]) {
      if (server.name !== 'home') {
        zombify(ns, server, target)
        await ns.sleep(400)
      }
    }
  }
  ns.tprint("Botnet.ns completed running.")
  let target = searcher.findBestPerLevel(ns.getHackingLevel())
  ns.tprint("Running purchase-server.script, targeting " + target.name)
  ns.run('purchase-server.script', 1, target.name, 6)
  ns.tprint("Spawning HackNet.js")
  ns.spawn("HackNet.js", 1)
}

function zombify(ns, serv, target) {
  let pid = ns.run("zombie-server.script", 1, serv.name, target, 0)
  ns.tprint("Zombifying " + serv.name + " with PID " + pid)
}
