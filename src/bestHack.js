import { fetchPlayer, getLSItem } from 'helpers.js'

const maxMoneyCoefficient = 1.25
const growthCoefficient = 1.1
const minSecurityCoefficient = 2
const growthCap = 100 // because otherwise N00dles is always on the top of the list
const securityWeight = 200
const maxWeakenTime = 15 * 60 * 1000

export function calcScore(server) {
  // {"hackingLvl":1,"maxMoney":0,"minSecurity":1,"growth":1}
  // let money = Math.pow(server.maxMoney, maxMoneyCoefficient)
  // let growth = Math.pow(Math.min(server.growth, growthCap), growthCoefficient)
  // let minSec = Math.pow(server.minSecurity, minSecurityCoefficient)
  // let hacking = server.hackingLvl

  // return (money * growth / (securityWeight + minSec * hacking))
  return server.maxMoney/server.minSecurity; // elsewhere filtered by hacking level
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
  ns.print(Object.values(searcher.serverData).map(s => [s.name, s.requiredHackingSkill, s.hasAdminRights, s.moneyMax]))
  ns.print(searcher.filterServers(fetchPlayer().skills.hacking).map(s => [s.name, s.requiredHackingSkill, s.hasAdminRights, s.moneyMax]))
  ns.tprint( searcher.findBestPerLevel(fetchPlayer().skills.hacking) )
}
