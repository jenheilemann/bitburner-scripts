import {
  runCommand,
  getLSItem,
  announce,
  getNsDataThroughFile as fetch,
  haveEnoughMoney, reserve
} from 'helpers.js'

// payoff within the hour
const min = 60, hour = min * 60

/**
 * @param {NS} ns
 **/
export async function main(ns) {
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
  const pservs = Object.values(nmap).filter(s => s.name != 'home' && s.purchasedByPlayer)
  const currRam = smallestCurrentServerSize(pservs)
  const nextRam = nextRamSize(ns, currRam)

  if (nextRam == 0) {
    return
  }

  const cost = ns.getPurchasedServerCost(nextRam)
  if ( !haveEnoughMoney(ns, cost) ){
    ns.print(`Not enough money to afford the server + reserve: ${cost} (${reserve(ns)})`)
    return
  }

  let msg = `Running pServBuyer.js to purchase ${ns.formatRam(2**nextRam)} (currently: ${ns.formatRam(currRam)})`
  announce(ns, msg)
  ns.tprint(msg)
  ns.tprint(` ns.spawn('pServBuyer.js', 1, '--size', ${nextRam})`)
  ns.spawn('pServBuyer.js', 1, '--size', nextRam)
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
  const totIncomePerSecond = Math.max(ns.getTotalScriptIncome()[0], 3200) // 3200 makes this script to return 32GB min
  const maxServerSize = ns.getPurchasedServerMaxRam()
  const incomePerPayoffTime = totIncomePerSecond * 2*hour
  ns.print(`Total income: ${ns.formatNumber(totIncomePerSecond)}/s`)
  ns.print(`Income per payoff time: ${ns.formatNumber(incomePerPayoffTime, 12)}`)
  if (incomePerPayoffTime == 0) return 0

  let cost, totalCost
  for (var i = 20; 2**i > currRam; i--) {
    // max server size can vary based on BN
    if ( 2**i > maxServerSize ) continue
    if (i < 0) { ns.ui.openTail(); throw `How is i less than 0? ${i}` }
    cost = ns.getPurchasedServerCost(2**i)
    totalCost = cost * limit

    ns.print(`Total cost for ${2**i}GB ram: ${ns.formatNumber(totalCost, 12)}`)
    if ( totalCost < incomePerPayoffTime ) {
      ns.print(`(${2**i}) totalCost < incomePerPayoffTime`)
      ns.print(`Returning ${2**i}`)
      return i
    }
  }
  return 0
}
