import { getLSItem, clearLSItem } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const player = getLSItem('PLAYER')
  if ( player.tor || player.money < 2e5)
    return

  ns.tprint(`Buying access to the Darkweb. ooOOOooo spoooooOOOkey`)
  ns.purchaseTor()
  // force refresh the network map
  clearLSItem('NMAP')
}
