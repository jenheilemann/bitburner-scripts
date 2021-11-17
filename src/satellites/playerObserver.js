import { setLSItem } from 'helpers.js'
import { purchaseables } from 'constants.js'
import { fetchServer } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let player = ns.getPlayer()
  player.isBusy = ns.isBusy()
  player.karma = ns.heart.break()

  const home = await fetchServer(ns, 'home')
  player.programs = home.files.filter(f => f.includes('.exe'))
  player.boughtAllPrograms = didPlayerBuyAllPrograms(player)

  setLSItem('PLAYER', player)
}

function didPlayerBuyAllPrograms(player) {
  if ( !player.tor )
    return false

  return purchaseables.every(f => player.programs.includes(f.name))
}
