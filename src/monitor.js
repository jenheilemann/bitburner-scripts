import { fetchServerFree, networkMapFree } from 'utils/network.js'
import { disableLogs, getLSItem, formatDuration } from 'utils/helpers.js'
import { findTop } from 'bestHack.js'
import { calcThreadsToHack,
          calcHackAmount,
          calcThreadsToGrow,
          getPercentUsedRam,
          calculatePercentMoneyHacked, } from '/batching/calculations.js'
import { BatchDataQueue } from '/batching/queue.js'

export function autocomplete(data, args) {
  return data.servers
}

/** @param {NS} ns */
export async function main(ns) {
  disableLogs(ns, ['sleep', 'getServerMoneyAvailable'])
  ns.ui.openTail()

  while (true) {
    await ns.sleep(100)
    ns.clearLog();
    let batches = fetchBatchQueue().batchList
    let nBatches = batches.length
    ns.print(`Batches: ${nBatches} --- ` +
      `Ram used: ${ns.formatPercent(getPercentUsedRam(networkMapFree()))} `)

    if (ns.args[0]) {
      printServer(ns, fetchServerFree(ns.args[0]), batches)
      continue
    }
    let top = findTop()
    for (let server of top) {
      let numBatches = batches.filter(b=>b.target == server.hostname).length
      if ( numBatches > 0 )
        printServer(ns, server, batches)
      batches = batches.filter(b => b.target !== server.hostname)
      if (batches?.length == 0)
        break
    }
  }
}

/**
 * @param {NS} ns
 * @param {Server} server
 * @param {BatchJob[]} batches
 **/
function printServer(ns, server, batches) {
  ns.print(` ----------- ${server.hostname}`)
  let percent = Math.round((server.moneyAvailable / server.moneyMax) * 100)
  ns.print(`*** Money    : \$${ns.formatNumber(server.moneyAvailable,0)} / \$${ns.formatNumber(server.moneyMax,0)} (${(percent)}%)`)
  let weakTime = ns.getWeakenTime(server.hostname)
  ns.print(`*** Growth   : ${server.serverGrowth.toString().padStart(3)} | ` +
            `Security : ${ns.formatNumber(server.hackDifficulty, 1)}/${ns.formatNumber(server.minDifficulty, 0)}`)
  let numBatches = batches.filter(b=>b.target == server.hostname).length
  ns.print(`*** Batches  : ${numBatches.toString().padStart(3)} | ` +
            `Time : ${formatDuration(weakTime)}`)

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

  server.moneyAvailable = server.moneyMax
  server.moneyAvailable -= server.moneyAvailable *
                           calculatePercentMoneyHacked(server) *
                           hackThreads
  let growThForHack = calcThreadsToGrow(server, server.moneyMax)
  ns.print(`* Grow       : ${growThreads.toString().padStart(3," ")} (${growThForHack})`)
  server.hackDifficulty = difficulty
  server.moneyAvailable = available

  weakThreads = Math.ceil(growThreads/12.5)
  weakThForHack = Math.ceil(growThForHack/12.5)
  ns.print(`* Weaken2    : ${weakThreads.toString().padStart(3," ")} (${weakThForHack})`)
}

/**
 * @returns {BatchDataQueue} For working with upcoming batches
 */
function fetchBatchQueue() {
  let rawData = getLSItem('batches') ?? []
  let batchDataQueue = new BatchDataQueue(rawData)
  batchDataQueue.discardExpiredBatchData()
  return batchDataQueue
}
