import {
  fetchPlayer,
  getLSItem,
  formatDuration,
  formatRam
} from 'utils/helpers.js'
import { HackBuilder } from '/batching/builder.js'
import {
  weakTime,
  calculatePercentMoneyHacked
} from '/batching/calculations.js'
import { createCurrentFormulas } from 'utils/formulas.js'


/**
 * Calculate a score to decide how lucrative it is to hack a server
 * @param {Server} s
 */
export function calcScore(s) {
  let player = fetchPlayer()
  let formulas = createCurrentFormulas()
  // clone the server so these manipulations don't affect anything else
  let server = structuredClone(s)
  // Set up the calculation with everything min/maxed
  server.hackDifficulty = server.minDifficulty
  server.moneyAvailable = server.moneyMax

  let batcher = new HackBuilder(server)
  let totalRamRequired = batcher.calcTotalRamRequired()
  let percentPerHack = calculatePercentMoneyHacked(server)
  let hackChance = formulas.hacking.hackChance(server, player)
  let moneyPerHack = server.moneyMax * percentPerHack * hackChance
  let maxTime = weakTime(server) / 1000

  return moneyPerHack/totalRamRequired/maxTime
}


export class BestHack {
  constructor(serverData) {
    this.serverData = serverData
  }

  /**
   * @param {number} player_hacking
   */
  findBestPerLevel(player_hacking) {
    let filtered = this.findTop(player_hacking)
    if (filtered.length == 0) {
      return false
    }
    return filtered[0]
  }

  /**
   * @param {number} player_hacking
   */
  findTop(player_hacking) {
    let filtered = this.filterServers(player_hacking)
    filtered.map(s => s.hackableScore = calcScore(s))
    return filtered.sort((a, b) => b.hackableScore - a.hackableScore)
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
      .filter((server) => server.requiredHackingSkill <= Math.max(Math.floor(player_hacking - 1), 1) &&
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

export function findTop() {
  let map = getLSItem('nmap')
  if (! map || map.length == 0 ) {
    throw new Error("No network map exists, BestHack can't work.")
  }

  let searcher = new BestHack(map)
  return searcher.findTop(fetchPlayer().skills.hacking)
}

export async function main(ns) {
  let map = getLSItem('nmap')
  if (! map ) {
    throw new Error("No network map exists, BestHack can't work.")
  }
  ns.clearLog()

  let searcher = new BestHack(map)
  let player = fetchPlayer()
  ns.print(player.skills.hacking)
  ns.print(`   s.name           , s.moneyMax, calcScore(s), weakTime(s), ramRequired ]`)
  let top = searcher.findTop(player.skills.hacking)
  for (let s of top) {
    ns.print(" | ",
      s.name.padEnd(18),
      `\$${ns.formatNumber(s.moneyMax,2).padStart(10)}`,
      ns.formatNumber(calcScore(s),2).padStart(14),
      formatDuration(weakTime(s)).padStart(13),
      formatRam((new HackBuilder(s).calcTotalRamRequired())).padStart(13)
    )
  }
  ns.tprint( top[0] )
}
