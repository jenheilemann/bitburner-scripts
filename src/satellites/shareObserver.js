import { networkMapFree } from 'utils/network.js'
import { getPercentUsedRam } from '/batching/calculations.js'

/** @param {NS} ns */
export async function main(ns) {
  const nmap = networkMapFree()
  ns.clearLog()

  if (!nmap) {
    ns.print("No network map, try again later")
    return
  }

  const percentUsed = getPercentUsedRam(nmap)
  if ( percentUsed > 0.7 ) {
    ns.print(`Using more than 70% ram, try when there's less used. (${ns.formatPercent(percentUsed)}%)`)
    return
  }
  ns.print(`Ram used less than 70%: ${ns.formatPercent(percentUsed)}%`)

  const sharePower = ns.getSharePower()
  if ( sharePower > 1.7 ) {
    ns.print(`Share power greater than 1.7: ${sharePower}`)
    return
  }
  ns.print(`Share power less than 1.7: ${sharePower}`)
  
  const pservs = Object.values(nmap)
    .filter(s => s.purchasedByPlayer && 
      s.hostname !== 'home' && 
      s.files.includes('share.js') )
    .sort((a, b) => { return b.availableRam - a.availableRam })
  ns.print(pservs.map(s => [s.hostname, s.availableRam]))
  const server = pservs[0]
  const threads = Math.floor((server.availableRam * 0.8)/4)

  ns.exec('share.js', server.hostname, { threads: threads })

}
