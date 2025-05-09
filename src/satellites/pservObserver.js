import {
  getLSItem,
  announce,
  myMoney
} from 'utils/helpers.js'
import { getPercentUsedRam } from '/batching/calculations.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.clearLog()
  // if there's already a buyer running, let it finish before starting another
  const homePS = ns.ps('home')
  if ( homePS.some(proc => proc.filename === 'pServBuyer.js') ) {
    ns.print("pServBuyer.js running currently, try again later.")
    return
  }

  const nmap = getLSItem('nmap')
  if ( !nmap ) {
    ns.print("NMAP not available, waiting until it comes back.")
    return
  }

  if (nmap['home'].maxRam < 16) {
    ns.print("Not enough ram on home to handle the pServBuyer script.")
    return
  }

  if (getPercentUsedRam(nmap) < 0.25) {
    ns.print("Enough ram to run batches, spend money elsewhere.")
    return
  }

  const pservs = Object.values(nmap).filter(s => s.name != 'home' && s.purchasedByPlayer)
  const currRam = smallestCurrentServerSize(ns, pservs)
  const nextRam = nextRamSize(ns, currRam)
  ns.print(`Current: ${currRam}  Next: ${2**nextRam} (2^${nextRam})`)


  if (nextRam == 0 ) {
    ns.print("INFO: NextRam is 0, cancelling.")
    return
  }
  if (2**nextRam == currRam) {
    ns.print("INFO: NextRam is currRam, cancelling.")
    return
  }
  if (nextRam >= 4 && nmap['home'].maxRam < 32) {
    ns.print("Pausing to allow upgrading home.")
    return
  }

  const cost = ns.getPurchasedServerCost(2**nextRam)
  if ( myMoney() < cost * 2 ){
    ns.print(`INFO: Not enough money to afford the server * 2: \$${ns.formatNumber(cost)} (\$${ns.formatNumber(myMoney())})`)
    return
  }

  let msg = `Running pServBuyer.js to purchase ${ns.formatRam(2**nextRam)} (currently: ${ns.formatRam(currRam)}) for \$${ns.formatNumber(cost)}`
  announce(ns, msg)
  // ns.tprint(msg)
  // ns.tprint(` ns.spawn('pServBuyer.js', 1, '--size', ${nextRam})`)
  ns.spawn('pServBuyer.js', {spawnDelay: 0}, '--size', nextRam)
}


/**
 * @param {NS} ns
 * @param {array} pservs
 **/
function smallestCurrentServerSize(ns, pservs) {
  const limit = ns.getPurchasedServerLimit()
  if (pservs.length < limit)
    return 0

  return pservs.reduce(((prev, cur) => prev.maxRam < cur.maxRam ? prev : cur)).maxRam
}

/**
 * @param {NS} ns
 * @param {integer} curRam
 * @param {array} pservs
 **/
function nextRamSize(ns, currRam) {
  const limit = ns.getPurchasedServerLimit()
  const maxServerSize = ns.getPurchasedServerMaxRam()
  const money = myMoney()
  ns.print(`My money: \$${ns.formatNumber(money)}`)

  let cost, totalCost, i
  for (i = 20; (i > 0 && 2**i > currRam); i--) {
    // max server size can vary based on BN
    if ( 2**i > maxServerSize ) continue
    if (i < 0) { ns.ui.openTail(); throw `How is i less than 0? ${i}` }
    cost = ns.getPurchasedServerCost(2**i)
    totalCost = cost * limit

    ns.print(`Total cost for ${2**i}GB ram: ${ns.formatNumber(totalCost, 12)}`)
    if ( cost*2 < money ) {
      ns.print(`(${2**i}) totalCost*2 < myMoney`)
      ns.print(`Returning ${i}`)
      return i
    }
  }
  return i + 1
}
