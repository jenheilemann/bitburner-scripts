import { networkMapFree } from 'network.js'
import {
          disableLogs,
          toolsCount,
          clearLSItem,
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

  if ( servers.length == 0 )
    return

  ns.tprint(`Nuking ${servers.length} servers with ${count} or less ports required.`)
  for ( const server of servers ) {
    root(ns, server)
  }
  ns.tprint(`SUCCESS: Nuked ${servers.map(s => s.name).join(", ")}`)
  clearLSItem('nmap')
}
