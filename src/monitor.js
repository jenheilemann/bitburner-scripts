import { fetchServerFree } from 'network.js'
import { disableLogs, getLSItem } from 'helpers.js'
import { findTop } from 'bestHack.js'
import { calcThreadsToHack, calcHackAmount } from '/batching/calculations.js'

export function autocomplete(data, args) {
  return data.servers
}

/** @param {NS} ns */
export async function main(ns) {
  disableLogs(ns, ['sleep', 'getServerMoneyAvailable'])
  ns.ui.openTail()
  ns.ui.resizeTail(500, 225)

  while (true) {
    await ns.sleep(100)
    ns.clearLog();
    ns.print(runSpinner())

    let batches = getLSItem('batches')
    let top = findTop()
    for (let server of top) {
      printServer(ns, server, batches)
      if ( !batches )
        break
      batches = batches.filter(b => b.target !== server.hostname)
      if (batches?.length == 0)
        break
    }
  }
}

function printServer(ns, server, batches) {
  let numBatches = batches ? batches.filter(b=>b.target == server.hostname).length : 0
  if (numBatches == 0) return

  ns.print(` ----------- ${server.hostname}`)
  let percent = Math.round((server.moneyAvailable / server.moneyMax) * 100)
  ns.print(`*** Money    : \$${ns.formatNumber(server.moneyAvailable,0)} / \$${ns.formatNumber(server.moneyMax,0)} (${(percent)}%)`)
  let weakTime = ns.getWeakenTime(server.hostname)
  ns.print(`*** Growth   : ${server.serverGrowth.toString().padStart(3)} | ` +
            `Security : ${ns.formatNumber(server.hackDifficulty, 1)}/${ns.formatNumber(server.minDifficulty, 0)}`)
  ns.print(`*** Batches  : ${numBatches.toString().padStart(3)} | ` +
            `Time : ${formatTime(weakTime)}`)

  let available = server.moneyAvailable
  server.moneyAvailable = server.moneyMax
  let difficulty = server.hackDifficulty
  server.hackDifficulty = server.minDifficulty
  let hackThreads = Math.ceil(calcThreadsToHack(server, server.moneyAvailable * calcHackAmount(server)))
  ns.print(`* Hack       : ${hackThreads.toString().padStart(3," ")}`)
  server.moneyAvailable = available
  server.hackDifficulty = difficulty

  let weakThreads = Math.ceil((server.hackDifficulty - server.minDifficulty)/0.05)
  let weakThForHack = Math.ceil(hackThreads/25)
  ns.print(`* Weaken     : ${weakThreads.toString().padStart(3," ")} (${weakThForHack})`)

  server.hackDifficulty = server.minDifficulty
  let multiplier = server.moneyMax / Math.max(server.moneyAvailable, 1)
  let growThreads = Math.ceil(ns.growthAnalyze(server.hostname, multiplier))
  multiplier = server.moneyMax / (Math.max(server.moneyMax, 1) * (1 - calcHackAmount(server)))
  let growThForHack = Math.ceil(ns.growthAnalyze(server.hostname, multiplier))
  ns.print(`* Grow       : ${growThreads.toString().padStart(3," ")} (${growThForHack})`)
  server.hackDifficulty = difficulty

  weakThreads = Math.ceil((server.hackDifficulty - server.minDifficulty)/0.05)
  weakThForHack = Math.ceil(growThForHack/12.5)
  ns.print(`* Weaken2    : ${weakThreads.toString().padStart(3," ")} (${weakThForHack})`)
}

/**
 * @returns {string} Time string, formatted nicely
 */
function formatTime(timeInMs) {
  if (timeInMs > 1000 * 60 * 60 )
    return new Date(timeInMs).toISOString().slice(11, 23)
  if (timeInMs > 1000 * 60 )
    return new Date(timeInMs).toISOString().slice(14, 23)
  if (timeInMs > 1000 )
    return new Date(timeInMs).toISOString().slice(17, 23)
  return new Date(timeInMs).toISOString().slice(18, 23)
}

/**
 * @returns {string} A spinner that cycles through an animation
 */
function runSpinner() {
  let spinnerText = "|/-\\"
  let rotation = spinnerText.length
  let curSec = Math.round(performance.now() /1000)

  return spinnerText[curSec % (rotation)].padStart(Math.round((curSec%75)/rotation), '.')
}
