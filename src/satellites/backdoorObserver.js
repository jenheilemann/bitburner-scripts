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
      continue
    if ( player.hacking < server.hackingLvl )
      continue
    if ( !server.data.hasAdminRights )
      continue

    await tryRun(ns, () => { ns.run('backdoor.js', 1, server.name) })
    return
    // can't do more than one at a time, as installBackdoor() can take 30+s
    // at low levels
  }
}
