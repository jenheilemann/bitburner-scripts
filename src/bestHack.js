import { toolsCount } from 'helpers.js'
import { networkMap } from 'network.js'

const maxMoneyCoefficient = 1.25
const growthCoefficient = 1.1
const minSecurityCoefficient = 2
const growthCap = 100 // because otherwise N00dles is always on the top of the list
const securityWeight = 200
const maxWeakenTime = 15 * 60

export function calcScore(server) {
  // {"hackingLvl":1,"maxMoney":0,"minSecurity":1,"growth":1}
  let money = Math.pow(server.maxMoney, maxMoneyCoefficient)
  let growth = Math.pow(Math.min(server.growth, growthCap), growthCoefficient)
  let minSec = Math.pow(server.minSecurity, minSecurityCoefficient)
  let hack = server.hackingLvl

  return (money * growth / (securityWeight + minSec * hack))
}

export class BestHack {
  constructor(serverData) {
    this.serverData = serverData
    this.calcsRun = false
  }
  findBestPerLevel(ns, level, maxPorts) {
    let scores = this.calcServerScores()
    let filtered = Object.values(scores)
      .filter((server) => server.hackingLvl <= level && server.portsRequired <= maxPorts)
      .filter((server) => ns.getWeakenTime(server.name) < maxWeakenTime)
    return filtered.reduce((prev, current) => (prev.score > current.score) ? prev : current)
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

export function main(ns) {
  let searcher = new BestHack(networkMap(ns).serverData)
  ns.tprint(searcher.findBestPerLevel(ns, ns.getHackingLevel(), toolsCount(ns)))
}
