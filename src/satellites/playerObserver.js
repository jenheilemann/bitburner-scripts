import { getLSItem, setLSItem } from 'helpers.js'
import { purchaseables } from 'constants.js'
import { fetchServer } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let player = ns.getPlayer()
  player.busy = ns.isBusy()
  player.karma = ns.heart.break()

  if ( isFirstRun() ) {
    player.programs = []
    player.boughtAllPrograms = false
  } else {
    const home = await fetchServer(ns, 'home')
    player.programs = home.files.filter(f => f.includes('.exe'))
    player.boughtAllPrograms = didPlayerBuyAllPrograms(player)
  }

  setLSItem('PLAYER', player)
}

function didPlayerBuyAllPrograms(player) {
  if ( !player.tor )
    return false

  return purchaseables.every(f => player.programs.includes(f.name))
}

function isFirstRun() {
  return getLSItem('player') === undefined
}
