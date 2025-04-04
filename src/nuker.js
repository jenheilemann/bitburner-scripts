import {
          disableLogs,
          toolsCount,
          clearLSItem,
          getLSItem
        } from 'helpers.js'
import { root } from 'rooter.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])

  let count = toolsCount()
  let nmap = getLSItem('nmap')
  if (!nmap) {
    ns.tprint(`Nuker.js: NMAP is not populated, can't nuke anything right now.`)
    return
  }
  let servers = Object.values(nmap)
    .filter((s) => !s.hasAdminRights &&
                 s.portsRequired <= count )

  if ( servers.length == 0 )
    return

  ns.tprint(`Nuking ${servers.length} servers with ${count} or less ports required.`)
  for ( const server of servers ) {
    root(ns, server)
  }
  ns.tprint(`SUCCESS: Nuked ${servers.map(s => s.name).join(", ")}`)
}
