import { getLSItem, clearLSItem, canUseSingularity } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const player = getLSItem('PLAYER')
  if ( player.tor || player.money < 2e5){
    ns.print("Tor already purchased, or not enough money.")
    return
  }
  if (!canUseSingularity()) {
    ns.tprint("Can't use the singularity yet, you have to go buy the Tor darkweb " +
      "server access manually at Alpha Enterprises.")
    return
  }
  ns.tprint(`Buying access to the Darkweb. ooOOOooo spoooooOOOkey`)
  ns.singularity.purchaseTor()
}
