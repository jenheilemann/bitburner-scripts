import { fetchPlayer } from 'helpers.js'
import { networkMapFree } from 'network.js'

const maxMoneyCoefficient = 1.25
const growthCoefficient = 1.1
const minSecurityCoefficient = 2
const growthCap = 100 // because otherwise N00dles is always on the top of the list
const securityWeight = 200
const maxWeakenTime = 15 * 60 * 1000

export function calcScore(server) {
  // {"hackingLvl":1,"maxMoney":0,"minSecurity":1,"growth":1}
  let money = Math.pow(server.maxMoney, maxMoneyCoefficient)
  let growth = Math.pow(Math.min(server.growth, growthCap), growthCoefficient)
  let minSec = Math.pow(server.minSecurity, minSecurityCoefficient)
  let hacking = server.hackingLvl

  return (money * growth / (securityWeight + minSec * hacking))
}

export class BestHack {
  constructor(serverData) {
    this.serverData = serverData
    this.calcsRun = false
  }

  /**
   * @param {NS} ns
   * @param {object} player
   */
  findBestPerLevel(ns, player) {
    let filtered = this.scoreAndFilterServers(ns, player)
    return filtered.reduce((prev, current) => (prev.score > current.score) ? prev : current)
  }

  /**
   * @param {NS} ns
   * @param {object} player
   */
  findTop(ns, player) {
    let filtered = this.scoreAndFilterServers(ns, player)
    return filtered.sort((a, b) => b.score - a.score)
  }

  /**
   * @param {NS} ns
   * @param {object} player
   * @param {number} count
   */
  findTopN(ns, player, count) {
    let filtered = this.findTop(ns, player)
    return filtered.slice(0, count)
  }

  /**
   * @param {NS} ns
   * @param {object} player
   */
  scoreAndFilterServers(ns, player) {
    let scores = this.calcServerScores()
    let filtered = Object.values(scores)
      .filter((server) => server.hackingLvl <= player.hacking &&
                          server.data.hasAdminRights &&
                          ns.formulas.hacking.weakenTime(server.data, player) < maxWeakenTime)
    return filtered
  }

  calcServerScores() {
    if (this.calcsRun) {
      return this.serverData
    }

    for (const server in this.serverData) {
      this.serverData[server].score = calcScore(this.serverData[server])
    }
    this.calcsRun = true
    return this.serverData
  }
}

export async function main(ns) {
  let searcher = new BestHack(await networkMapFree())
  ns.tprint( searcher.findBestPerLevel(ns, fetchPlayer()) )
}
