import { networkMap, fetchServer } from 'network.js'
import { BestHack } from 'bestHack.js'
import { toolsCount, tryRun, fetchPlayer, groupBy } from 'helpers.js'
import { root } from 'rooter.js'
import { rootFiles } from 'constants.js'
import { calculateWeakenTime } from '/formulae/hacking.js'

const crackers = [0].concat(rootFiles.map(f => f.name))

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog('sleep')

  const serversByPortsRequired = groupBy(Object.values(await networkMap(ns)), (s) => s.portsRequired)
  let player, target, searcher, waitTime;

  for (let i = 0; i < crackers.length; i++) {
    if (i > 0) {
      ns.print("Waiting for the next cracking tool...")
      do {
        await ns.sleep(10000)
        player = fetchPlayer()
      } while ( !player.programs.includes(crackers[i]) );
    }

    player = fetchPlayer()
    searcher = new BestHack(await networkMap(ns))
    target = searcher.findBestPerLevel(player, toolsCount())
    root(ns, await fetchServer(ns, target.name))

    ns.tprint("Zombifying level " + i + " servers, targeting " + target.name)
    for (let server of serversByPortsRequired[i]) {
      if (server.name !== 'home') {
        await zombify(ns, server, target.name)
        await ns.sleep(200)
      }
    }

    // wait a sec for us to level up a little
    target = await fetchServer(ns, target.name)
    player = fetchPlayer()
    waitTime = calculateWeakenTime(target.data, player)
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
  root(ns, await fetchServer(ns,serv.name))
  let pid = await tryRun(ns, () => ns.run("zombifier.js", 1, serv.name, target))
  ns.tprint("Zombifying " + serv.name + " with PID " + pid)
}
