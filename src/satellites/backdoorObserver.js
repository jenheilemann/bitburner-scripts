import { getLSItem, tryRun } from 'helpers.js'
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

    await tryRun(ns, () => { ns.run('backdoor.js', 1, server.name) })
    ns.tprint(`Backdoor running on ${server.name}`)
    await ns.sleep(100) // give it a sec to spin up
    ns.connect('home')
  }
}
