import { networkMapFree } from 'network.js'
import {
          disableLogs,
          toolsCount,
          clearLSItem,
          getNsDataThroughFile as fetch,
        } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])

  let count = toolsCount()
  let servers = Object.values(await networkMapFree())
    .filter(s => !s.data.hasAdminRights &&
                 s.portsRequired <= count )

  ns.tprint(`Nuking servers with ${count} or less ports required.`)
  for ( const server of servers ) {
    await fetch(ns, `ns.run("rooter.js", 1, ${server.name}`)
  }
  ns.tprint(`Nuked ${servers.map(s => s.name).join(", ")}`)
  ns.tprint(`Spawning botnet.`)

  clearLSItem('nmap')
  await fetch(ns, `ns.spawn("botnet.js", 1)`)
}
