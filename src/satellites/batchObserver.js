import { fetchPlayer } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { BestHack } from 'bestHack.js'
import { getPercentUsedRam } from '/batching/calculations.js'

/** @param {NS} ns */
export async function main(ns) {
  const nmap = networkMapFree()

  if ( getPercentUsedRam(nmap) > 0.97 ) {
    ns.print("Enough ram used, seems good.")
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
  const home = nmap['home']
  if ( hackingLvl < 5 || home.maxRam < 64)
    return "n00dles"

  if ( hackingLvl < 200 )
    return 'joesguns'

  if ( hackingLvl < 800 )
    return 'phantasy'

  if ( hackingLvl < 2000 )
    return 'rho-construction'

  const searcher = new BestHack(nmap)
  const servers = searcher.findTop(hackingLvl)
  ns.print(`Servers that make some kinda sense to hack`)
  ns.print(servers.map(s => s.hostname))
  return servers[0].hostname
}
