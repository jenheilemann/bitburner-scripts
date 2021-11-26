import { networkMapFree } from 'network.js'
import {
          disableLogs,
          toolsCount,
          clearLSItem,
          tryRun,
        } from 'helpers.js'
import { root } from 'rooter.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])

  let count = toolsCount()
  let servers = Object.values(await networkMapFree())
    .filter(s => !s.data.hasAdminRights &&
                 s.portsRequired <= count )

  ns.tprint(`Nuking ${servers.length} servers with ${count} or less ports required.`)
  for ( const server of servers ) {
    root(ns, server)
  }
  ns.tprint(`SUCCESS: Nuked ${servers.map(s => s.name).join(", ")}`)
  ns.tprint(`Spawning botnet.`)

  clearLSItem('nmap')
  await tryRun(ns, () => ns.run("botnet.js", 1))
}
