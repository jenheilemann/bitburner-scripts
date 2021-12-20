import { fetchPlayer, tryRun } from 'helpers.js'
import { purchaseables } from 'constants.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const player = fetchPlayer()
  if ( player.tor && player.boughtAllPrograms ) {
    return
  }

  if ( !player.tor ) {
    if ( player.money > 2e5 ) {
      await tryRun(() => ns.run('/satellites/torBuyer.js'))
    }
    return
  }

  for ( const file of purchaseables ) {
    if ( !player.programs.includes(file.name) ) {
      if ( player.money > file.cost) {
        await tryRun(() => ns.run('/satellites/programBuyer.js', 1, file.name))
      }
      return
    }
  }
}
