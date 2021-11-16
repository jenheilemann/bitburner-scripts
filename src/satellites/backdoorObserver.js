import { getLSItem, tryRun } from 'helpers.js'
import { networkMap } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const nmap = await networkMap(ns)
  const player = getLSItem('PLAYER')

  for ( const server of Object.values(nmap)) {
    if ( server.data.backdoorInstalled )
      return
    if ( player.hacking < server.hackingLvl )
      return
    if ( !server.hasAdminRights )
      return

    await tryRun(ns, () => { ns.run('backdoor.js', 1, server.name) })
    await ns.sleep(50)
  }
}
