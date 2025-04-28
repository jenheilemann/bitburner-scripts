import { getLSItem, setLSItem } from 'utils/helpers.js'
import { purchaseables } from 'constants.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let player = ns.getPlayer()
  player.karma = ns.heart.break()
  player.resetInfo = getLSItem('reset')
  player.tor = ns.hasTorRouter()

  if ( isFirstRun() ) {
    player.programs = []
    player.boughtAllPrograms = false
  } else {
    const files = ns.ls('home')
    player.programs = files.filter(f => f.includes('.exe'))
    player.boughtAllPrograms = didPlayerBuyAllPrograms(player)
  }

  setLSItem('player', player)
}

function didPlayerBuyAllPrograms(player) {
  if ( !player.tor )
    return false

  return purchaseables.every(f => player.programs.includes(f.name))
}

function isFirstRun() {
  return getLSItem('player') === undefined
}
