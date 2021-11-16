import { getLSItem, tryRun } from 'helpers.js'
import { networkMap } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const nmap = networkMap(ns)

  Object.values(nmap).forEach(server => {
    if ( server.data.backdoorInstalled )
      return
    if ( player.hacking < server.hackingLvl )
      return
    if ( server.portsRequired < server.data.openPortsCount )
      return

    await tryRun(ns, () => { ns.run('backdoor.js', 1, server.name) })
  })
}
