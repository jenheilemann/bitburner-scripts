import { setLSItem } from 'helpers.js'
import { purchaseables } from 'constants.js'
import { getServer } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let player = ns.getPlayer()
  player.isBusy = ns.isBusy()

  const home = await getServer(ns, 'home')
  player.programs = home.files.filter(f => f.includes('.exe'))
  player.boughtAllPrograms = didPlayerBuyAllPrograms(player)

  setLSItem('PLAYER', player)
}

function didPlayerBuyAllPrograms(player) {
  if ( !player.tor )
    return false

  return player.programs.length >= Object.keys(purchaseables).length
}
