import { fetchPlayer, getLSItem } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { BestHack } from 'bestHack.js'
import { getPercentUsedRam } from '/batching/calculations.js'
import { BatchDataQueue } from '/batching/queue.js'

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

  const hackingLvl = fetchPlayer().skills.hacking
  let target = findBestTarget(ns, nmap, hackingLvl)

  ns.spawn("batching/shotgunBatcher.js", {spawnDelay: 0, threads: 1}, "--target", target )
}

/**
 * Returns a server object that's probably the best one to send a batch against
 * right now, maybe?
 * @param {NS} ns
 * @param {Server[]} nmap
 * @param {number} hackingLvl
 **/
function findBestTarget(ns, nmap, hackingLvl) {
  if ( hackingLvl > 3500 ) {
    const searcher = new BestHack(nmap)
    const servers = searcher.findTop(hackingLvl)
    ns.print(`Servers that make some kinda sense to hack`)
    ns.print(servers.map(s => s.hostname))
    return servers[0].hostname
  }

  if ( hackingLvl > 1200 && nmap['rho-construction'].hasAdminRights ){
    return 'rho-construction'
  }

  if ( hackingLvl > 500 && nmap['phantasy'].hasAdminRights ){
    return 'phantasy'
  }

  const home = nmap['home']
  if ( hackingLvl > 20 && home.maxRam >= 64 && nmap['joesguns'].hasAdminRights ){
    return 'joesguns'
  }
  return 'n00dles'
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
