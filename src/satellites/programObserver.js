import { fetchPlayer, tryRun, canUseSingularity } from 'utils/helpers.js'
import { purchaseables } from 'utils/constants.js'

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
      if (!canUseSingularity()) {
        ns.tprint("WARNING: We haven't yet reached the singularity; purchase Tor darkweb " +
          "access manually at Alpha Enterprises.")
        return
      }
      await tryRun(() => ns.run('torBuyer.js'))
    }
    return
  }

  for ( const file of purchaseables ) {
    if ( !player.programs.includes(file.name) ) {
      if ( player.money > file.cost) {

        if (!canUseSingularity()) {
          ns.tprint(`WARNING: We haven't yet reached the singularity; purchase ${file.name} ` +
            `manually: \`buy ${file.name}\``)
          return
        }

        await tryRun(() => ns.run('programBuyer.js', 1, file.name))
      }
      return
    }
  }
}
