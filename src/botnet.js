import { networkMapFree } from 'network.js'
import { BestHack } from 'bestHack.js'
import {
          tryRun,
          fetchPlayer,
          disableLogs,
          toolsCount,
        } from 'helpers.js'
// magic number (Ram required to run breadwinner.js)
let hackingScriptSize = 2

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])

  let servers = Object.values(await networkMapFree())
    .filter(s => s.data.hasAdminRights &&
                !s.data.purchasedByPlayer &&
                s.maxRam > 0 &&
                s.maxRam - s.data.ramUsed >= hackingScriptSize )

  let searcher = new BestHack(await networkMapFree())
  let target = searcher.findBestPerLevel(fetchPlayer())

  ns.tprint("Zombifying " + servers.length + " servers, targeting " + target.name)
  for (let server of servers) {
    if (server.name !== 'home') {
      await zombify(ns, server.name, target.name)
      await ns.sleep(200)
    }
  }

  ns.tprint(`Starting up hacknet to buy ${toolsCount() + 1} hacknet servers`)
  let pid = await tryRun(ns, () => ns.run("/hacknet/startup.js", 1, toolsCount() + 1))
}

async function zombify(ns, server, target) {
  let pid = await tryRun(ns, () => ns.run("zombifier.js", 1, server, target))
  ns.tprint("Zombifying " + server + " with PID " + pid)
}
