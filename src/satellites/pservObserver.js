import {
  getNsDataThroughFile as fetch,
  runCommand,
  formatRam,
} from 'helpers.js'
import { networkMapFree } from 'network.js'

// payoff within the hour
const min = 60, hour = min * 60

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  // if there's already a buyer running, let it finish before starting another
  const homePS = await fetch(ns, `ns.ps('home')`)
  if ( homePS.some(proc => proc.filename === 'buyer.js') ) {
    return
  }

  const nmap = await networkMapFree(ns)
  const pservs = Object.values(nmap).filter(s => s.name != 'home' && s.data.purchasedByPlayer)
  const currRam = smallestCurrentServerSize(pservs)
  const nextRam = await nextRamSize(ns, currRam)

  if (nextRam == 0) {
    return
  }

  ns.tprint(`Running buyer.js to purchase ${formatRam(nextRam)} (currently: ${formatRam(currRam)})`)
  ns.tprint(` ns.spawn('buyer.js', 1, '--size', ${nextRam})`)
  await runCommand(ns, `for (let i = 0,pid = 0; pid == 0 && i < 10; i++) { pid = ns.spawn('buyer.js', 1, '--size', ${nextRam}) }`)
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
async function nextRamSize(ns, currRam) {
  const limit = await fetch(ns, `ns.getPurchasedServerLimit()`)
  const totIncomePerSecond = await fetch(ns, `ns.getScriptIncome()[0]`)
  const incomePerPayoffTime = totIncomePerSecond * 2*hour
  ns.print(`Total income: ${ns.nFormat(totIncomePerSecond, "$0,0")}`)
  ns.print(`Income per payoff time: ${ns.nFormat(incomePerPayoffTime, "$0,0")}`)

  let cost, totalCost
  for (var i = 20; 2**i > currRam; i--) {
    cost = await fetch(ns, `ns.getPurchasedServerCost(${2**i})`)
    totalCost = cost * limit

    ns.print(`Total cost for ${2**i}GB ram: ${ns.nFormat(totalCost, "$0,0")}`)
    if ( totalCost < incomePerPayoffTime ) {
      ns.print(`(${2**i}) totalCost < incomePerPayoffTime`)
      ns.print(`Returning ${2**i}`)
      return i
    }
  }
  return 0
}
