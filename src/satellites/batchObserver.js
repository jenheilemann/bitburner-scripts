import { fetchPlayer, getLSItem } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { BestHack } from 'bestHack.js'
import { getPercentUsedRam, weakTime } from '/batching/calculations.js'
import { BatchDataQueue } from '/batching/queue.js'
import { createCurrentFormulas } from '/utils/formulas.js'

/** @param {NS} ns */
export async function main(ns) {
  const nmap = networkMapFree()

  if ( getPercentUsedRam(nmap) > 0.9 ) {
    ns.print("Enough ram used, seems good.")
    return
  }

  if ( getRunningBatchesCount() > 10_000 ) {
    ns.print("Enough batches, don't run out of memory!")
    return
  }

  let target = findBestTarget(ns, nmap)

  ns.spawn("batching/shotgunBatcher.js", {spawnDelay: 0, threads: 1}, "--target", target )
}

/**
 * Returns a server object that's probably the best one to send a batch against
 * right now, maybe?
 * @param {NS} ns
 * @param {Server[]} nmap
 **/
function findBestTarget(ns, nmap) {
  const player = fetchPlayer()
  const fs = createCurrentFormulas()
  const hackingLvl = player.skills.hacking
  const fiveMin = 5 * 60 * 1000

  if ( hackingLvl > 3500 ) {
    const searcher = new BestHack(nmap)
    const servers = searcher.findTop(hackingLvl)
    ns.print(`Servers that make some kinda sense to hack`)
    ns.print(servers.map(s => s.hostname))
    return servers[0].hostname
  }

  if ( hackingLvl > 1200 && isServerWorthIt(nmap['rho-construction'], player, fs, fiveMin) ){
    return 'rho-construction'
  }

  if ( hackingLvl > 500 && isServerWorthIt(nmap['phantasy'], player, fs, fiveMin) ){
    return 'phantasy'
  }

  const home = nmap['home']
  if ( hackingLvl > 20 && home.maxRam >= 64 && isServerWorthIt(nmap['joesguns'], player, fs, fiveMin) ){
    return 'joesguns'
  }
  return 'n00dles'
}

/**
 * @param {Server} server
 * @param {Player} player
 * @param {Formulas} fs
 * @param {number} maxTime - max time we're willing to wait for weakes to run
 */
function isServerWorthIt(server, player, fs, maxTime) {
  const oldSecurity = server.security
  server.security = server.minSecurity
  const hChance = fs.hacking.hackChance(server, player)
  server.security = oldSecurity
  return server.hasAdminRights && weakTime(server) < maxTime && hChance > 0.9
}

/**
 * @returns {number} how many batches are currently running
 */
function getRunningBatchesCount() {
  const queue = fetchBatchQueue()
  return queue.batchList.length
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
