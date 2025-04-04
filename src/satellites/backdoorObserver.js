import { getLSItem, tryRun, canUseSingularity } from 'helpers.js'
import { networkMap } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const nmap = await networkMap(ns)
  const player = getLSItem('PLAYER')

  for ( const server of Object.values(nmap)) {
    if ( server.data.backdoorInstalled || server.data.purchasedByPlayer )
      continue
    if ( player.hacking < server.hackingLvl )
      continue
    if ( !server.data.hasAdminRights )
      continue

    if (canUseSingularity()) {
      ns.tprint('Attempting automatic backdoor of ' + server.name)
      await tryRun(() => { ns.run('backdoor.js', 1, server.name) })
    } else {
      ns.tprint('Backdoor of ' + server.name + " available, finding path.")
      await tryRun(() => { ns.run('find.js', 1, server.name) })
    }
  }
}
