import {
  getLSItem,
  announce,
  myMoney
} from 'utils/helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.clearLog()
  // if there's already a buyer running, let it finish before starting another
  const homePS = ns.ps('home')
  if ( homePS.some(proc => proc.filename === 'pServBuyer.js') ) {
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

  const pservs = Object.values(nmap).filter(s => s.name != 'home' && s.purchasedByPlayer)
  const currRam = smallestCurrentServerSize(pservs)
  const nextRam = nextRamSize(ns, currRam)
  ns.print(`Current: ${currRam}  Next: ${nextRam}`)

  if (nextRam == 0) {
    return
  }

  const cost = ns.getPurchasedServerCost(2**nextRam)
  if ( myMoney() < cost * 10 ){
    ns.tprint(`Not enough money to afford the server * 10: ${cost} (${myMoney()})`)
    return
  }

  let msg = `Running pServBuyer.js to purchase ${ns.formatRam(2**nextRam)} (currently: ${ns.formatRam(currRam)})`
  announce(ns, msg)
  // ns.tprint(msg)
  // ns.tprint(` ns.spawn('pServBuyer.js', 1, '--size', ${nextRam})`)
  ns.spawn('pServBuyer.js', {spawnDelay: 0}, '--size', nextRam)
}


/**
 * @param {array} pservs
 **/
function smallestCurrentServerSize(pservs) {
  if (pservs.length == 0)
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

  let cost, totalCost
  for (var i = 20; 2**i > currRam; i--) {
    // max server size can vary based on BN
    if ( 2**i > maxServerSize ) continue
    if (i < 0) { ns.ui.openTail(); throw `How is i less than 0? ${i}` }
    cost = ns.getPurchasedServerCost(2**i)
    totalCost = cost * limit

    ns.print(`Total cost for ${2**i}GB ram: ${ns.formatNumber(totalCost, 12)}`)
    if ( totalCost*2 < myMoney ) {
      ns.print(`(${2**i}) totalCost*2 < myMoney`)
      ns.print(`Returning ${i}`)
      return i
    }
  }
  return 0
}
