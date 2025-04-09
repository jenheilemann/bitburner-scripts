import { fetchPlayer, getLSItem } from 'helpers.js'
import { HackBuilder } from '/batching/builder.js'
import { weakTime } from '/batching/calculations.js'


export function calcScore(server) {
  let batcher = new HackBuilder(server)
  let totalRamRequired = batcher.calcTotalRamRequired()
  let maxTime = weakTime(server) / 1000
  return server.maxMoney/totalRamRequired/maxTime
}

export class BestHack {
  constructor(serverData) {
    this.serverData = serverData
    this.calcsRun = false
  }

  /**
   * @param {number} player_hacking
   */
  findBestPerLevel(player_hacking) {
    let filtered = this.filterServers(player_hacking)
    if (filtered.length == 0) {
      return false
    }
    return filtered.reduce((a, b) => (calcScore(a) > calcScore(b)) ? a : b)
  }

  /**
   * @param {number} player_hacking
   */
  findTop(player_hacking) {
    let filtered = this.filterServers(player_hacking)
    return filtered.sort((a, b) => calcScore(b) - calcScore(a))
  }

  /**
   * @param {number} player_hacking
   * @param {number} count
   */
  findTopN(player_hacking, count) {
    let filtered = this.findTop(player_hacking)
    return filtered.slice(0, count)
  }

  /**
   * @param {number} player_hacking
   */
  filterServers(player_hacking) {
    let filtered = Object.values(this.serverData)
      .filter((server) => server.requiredHackingSkill <= Math.max(Math.floor(player_hacking/2), 1) &&
                          server.hasAdminRights &&
                          server.moneyMax > 0)
    return filtered
  }
}

export function findBestTarget() {
  let map = getLSItem('nmap')
  if (! map || map.length == 0 ) {
    throw new Error("No network map exists, BestHack can't work.")
  }

  let searcher = new BestHack(map)
  return searcher.findBestPerLevel(fetchPlayer().skills.hacking)
}

export async function main(ns) {
  let map = getLSItem('nmap')
  if (! map ) {
    throw new Error("No network map exists, BestHack can't work.")
  }

  let searcher = new BestHack(map)
  ns.print(Math.max(Math.floor(fetchPlayer().skills.hacking/2)))
  ns.print(`[s.name, s.moneyMax, calcScore(s), weakTime(s)/1000, ramRequired ]`)
  for (let s of searcher.filterServers(fetchPlayer().skills.hacking)) {
    ns.print([
      s.name.padEnd(15),
      s.moneyMax,
      calcScore(s),
      weakTime(s)/1000,
      new HackBuilder(s).calcTotalRamRequired()])
  }
  ns.tprint( searcher.findBestPerLevel(fetchPlayer().skills.hacking) )
}
