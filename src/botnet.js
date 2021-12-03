import { networkMapFree } from 'network.js'
import {
          runCommandAndWait,
          disableLogs,
        } from 'helpers.js'
// magic number (Ram required to run breadwinner.js)
const hackingScriptSize = 1.7
const scripts = ['hack.js', 'grow.js', 'weaken.js']

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

  // early return, if there are no servers no need to do anything else
  if ( servers.length == 0 ) {
    return
  }

  ns.tprint("Zombifying " + servers.length + " servers")
  for (let server of servers) {
    if (server.name !== 'home') {
      await zombify(ns, server.name)
      await ns.sleep(200)
    }
  }
}

async function zombify(ns, server) {
  for (const script of scripts) {
    await runCommandAndWait(ns, `ns.scp('${script}', "home", '${server}')`)
  }
  ns.print(`Copied ${scripts} to ${server}`)
}
