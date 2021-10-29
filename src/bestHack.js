import { toolsCount } from 'rooter.js'
import { networkMap } from 'network.js'

const maxMoneyCoefficient = 1.25
const growthCoefficient = 1.1
const minSecurityCoefficient = 2
const growthCap = 100 // because otherwise N00dles is always on the top of the list
const securityWeight = 200

export function calcScore(server) {
  // {"hackingLvl":1,"maxMoney":0,"minSecurity":1,"growth":1}
  let money = Math.pow(server.maxMoney, maxMoneyCoefficient)
  let growth = Math.pow(Math.min(server.growth, growthCap), growthCoefficient)
  let minSec = Math.pow(server.minSecurity, minSecurityCoefficient)
  let hack = server.hackingLvl

  return (money * growth / (securityWeight + minSec * hack))
}

export function BestHack(serverData) {
  this.serverData = serverData
  this.calcsRun = false
}

BestHack.prototype.findBestPerLevel = function (level, maxPorts) {
  let scores = this.calcServerScores()
  let perLevel = Object.values(scores).filter((server) => server.hackingLvl <= level && server.portsRequired <= maxPorts )
  return perLevel.reduce((prev, current) => (prev.score > current.score) ? prev : current)
}

BestHack.prototype.calcServerScores = function () {
  if (this.calcsRun) {
    return this.serverData
  }

  for (const server in this.serverData) {
    this.serverData[server].score = calcScore(this.serverData[server])
  }
  this.calcsRun = true
  return this.serverData
}

export function main(ns) {
  let searcher = new BestHack(networkMap(ns).serverData)
  ns.tprint(searcher.findBestPerLevel(ns.getHackingLevel(), toolsCount(ns)))
}
