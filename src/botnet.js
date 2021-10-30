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
  let target, waitTime;

  for (let i = 0; i < crackers.length; i++) {
    if (i > 0) {
      ns.print("Waiting for the next cracking tool...")
      do {
        await ns.sleep(10000)
      } while (!ns.fileExists(crackers[i], 'home'));
    }

    target = searcher.findBestPerLevel(ns.getHackingLevel(), toolsCount(ns))
    ns.tprint("Targeting " + target.name + ", ensuring sudo first.")
    ns.run("hack-server.script", 1, target.name, 0)

    ns.tprint("Zombifying level " + i + " servers, targeting " + target.name)
    for (let server of serversByPortsRequired[i]) {
      if (server.name !== 'home') {
        zombify(ns, server, target.name)
        await ns.sleep(400)
      }
    }

    // wait a sec for us to level up a little
    waitTime = ns.getWeakenTime(target.name)
    ns.tprint(`Waiting ${ns.tFormat(waitTime)} seconds to level up a little`)
    await ns.sleep(waitTime * 1000)
  }

  ns.tprint("Botnet.ns completed running. You have taken over the world! Mwahaha")
  ns.run('/hacknet/startup.js', 1, 5)
}

function zombify(ns, serv, target) {
  let pid = ns.run("zombie-server.script", 1, serv.name, target, 0)
  ns.tprint("Zombifying " + serv.name + " with PID " + pid)
}
