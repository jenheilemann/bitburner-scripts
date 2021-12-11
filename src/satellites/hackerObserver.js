import {
  disableLogs,
  fetchPlayer,
  getLSItem, setLSItem,
  formatDuration, formatNumber, formatMoney,
} from 'helpers.js'
import { networkMap, fetchServer } from 'network.js'
import { BestHack } from 'bestHack.js'

// avoid calling getScriptRam
const ramSizes = {
  'hack.js'   : 1.7,
  'weaken.js' : 1.75,
  'grow.js'   : 1.75,
}

// Configuration. Change these as desired.
const reservedRam = 40
const bufferTime = 30 //ms
const hackDecimal = 0.05
const sleepTime = 1000 //ms

// Game-set constants. Don't change these magic numbers.
const securityWeakenedPerThread = 0.05
const serverFortifyAmount = 0.002
const growTimeMultiplier = 3.2 // Relative to hacking time. 16/5 = 3.2
const weakenTimeMultiplier = 4 // Relative to hacking time

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['exec', 'sleep'])
  let nmap, player, searcher, targets
  const processManager = new ProcessManager()
  if ((typeof getLSItem('hackpercent')) != 'number') setLSItem('hackpercent', hackDecimal)

  while(true) {
    nmap = await networkMap(ns)
    player = fetchPlayer()
    processManager.cleanup(ns)
    searcher = new BestHack(nmap)
    targets = searcher.findTop(ns, player)
    if ( targets.some(s => s.name === 'joesguns') && targets[0].name != 'joesguns' ) {
      targets = targets.filter(s => s.name != 'joesguns')
      targets.splice(1, 0, await fetchServer(ns, 'joesguns'))
    }

    for (let server of targets) {
      try {
        ns.print(`INFO: Targeting ${server.name} ......................`)
        targetServer(ns, server, nmap, processManager)
      }
      catch(err) {
        if ( err instanceof OutOfRamException ) {
          ns.print(`WARNING: ${err}`)
          break
        }
        throw err
      }
    }
    report(ns, targets)
    await ns.sleep(sleepTime)
  }
}

/**
 * @param {NS} ns
 * @param {object[]} targets
 **/
function report(ns, targets) {
  ns.print(reporter.output(ns, targets))
  reporter = new Report()
}

function recordActivity(type, threads) {
  reporter.record(type, threads)
}

class Report {
  constructor() {
    this.activity = { 
      w: { type: 'w', threads: 0, servers: 0 },
      g: { type: 'g', threads: 0, servers: 0 }, 
      h: { type: 'h', threads: 0, servers: 0 },
    }
  }
  record(type, threads) {
    type = type[0]
    this.activity[type].threads += threads
    this.activity[type].servers += 1
  }
  output(ns, servers) {
    let str = 'SUCCESS: ---------- '
    str += this.activitySummary()
    str += this.serverSummary(ns, servers)
    return str
  }
  activitySummary() {
    let str = '\n\r'
    const activity = Object.values(this.activity)
    const totalThreads = activity.reduce((t, a) => { return t + a.threads }, 0)
    str += `${totalThreads.toString().padStart(6)} threads `
    activity.forEach( a => 
      str += `${a.threads.toString().padStart(5)} ${a.type} threads ` +
        `(${a.servers.toString().padStart(2)} servers) `
    )
    return str
  }
  serverSummary(ns, servers) {
    let str = ''
    const top = servers.slice(0,5)
    const nameLength = Math.max(... top.map(t => t.name.length))
    for (const server of top ) {
      str += `\n\r${server.name.padEnd(nameLength)} / ` +
        `Security: ${formatNumber(server.security).padStart(5)}/` +
        `${formatNumber(server.minSecurity).padEnd(5)} / ` +
        `Money: ${formatMoney(server.data.moneyAvailable).padStart(9)}/` +
        `${formatMoney(server.maxMoney).padEnd(9)} / ` +
        `Weak time: ${formatDuration(ns.formulas.hacking.weakenTime(server.data, fetchPlayer()))}`
    }
    return str 
  }
}
let reporter = new Report()

/**
 * @param {NS} ns
 * @param {object} target - server to attempt to target
 * @param {object} nmap - network map of all servers
 * @param {object} processManager - manages what processes are running
 **/
function targetServer(ns, target, nmap, processManager) {
  ns.print(`Security: ${formatNumber(target.security)}/${formatNumber(target.minSecurity)} ----- ` +
    `Money: ${formatMoney(target.data.moneyAvailable)}/${formatMoney(target.maxMoney)}`)

  const targeter = new Targeter(ns, target, nmap, processManager)
  targeter.weakenServer()
  targeter.growServer()
  targeter.hackServer()
}

class Targeter {
  constructor(ns, target, nmap, processManager) {
    this.ns = ns 
    this.target = target 
    this.nmap = nmap
    this.processManager = processManager
    ns.print(`H : ${formatDuration(this.hackTime())} / ` +
      `G : ${formatDuration(this.growTime())} / ` + 
      `W : ${formatDuration(this.weakTime())}`)
  } 

  weakenServer() {
    // Start by just ensuring the server is weak enough
    if ( this.target.security < this.target.minSecurity + 2 ) {
      return
    }
    let weakThreads = this.weakenInfo(this.target.security - this.target.minSecurity)
    weakThreads = weakThreads - this.threadCount('weaken.js')
    if ( weakThreads < 1 )  {
      return
    }
    const minerManager = [
      new MinerManager('weaken.js', weakThreads, 0)
    ]
    this.findRamAndLaunch(minerManager, 'weaken.js')
  }

  growServer() {
    if ( this.target.data.moneyAvailable > this.target.maxMoney * 0.9 ) {
      return
    }

    let growThreads = this.growthInfo(this.target.maxMoney - this.target.data.moneyAvailable)
    growThreads = growThreads - this.threadCount('grow.js')
    if ( growThreads < 1 ) {
      return
    }

    const weakThreads = this.weakenInfo(2 * serverFortifyAmount * growThreads)
    const minerManagers = [
      new MinerManager('grow.js', growThreads, this.weakTime()-this.growTime()+bufferTime),
      new MinerManager('weaken.js', weakThreads, 0)
    ]
    this.findRamAndLaunch(minerManagers, 'grow.js')
  }

  hackServer() {
    // if security or money are too far out of bounds, move on to another server
    if ( this.target.security >= this.target.minSecurity + 2 ) {
      return
    }
    if ( this.target.data.moneyAvailable <= this.target.maxMoney * 0.5 ) {
      return
    }

    let [hackThreads, hackedMoney] = this.hackInfo()
    if (hackThreads < 1) return
    let replace = Math.max(1, hackedMoney)

    let growThreads = this.growthInfo( replace )
    let hWeakThreads = this.weakenInfo(hackThreads * serverFortifyAmount)
    let gWeakThreads = this.weakenInfo(2*growThreads*serverFortifyAmount)

    let minerManagers = [
      new MinerManager('hack.js',   hackThreads,  this.weakTime()-this.hackTime()-bufferTime),
      new MinerManager('weaken.js', hWeakThreads, 0),
      new MinerManager('grow.js',   growThreads,  this.weakTime()-this.growTime()+bufferTime),
      new MinerManager('weaken.js', gWeakThreads, bufferTime*2)
    ]
    this.findRamAndLaunch( minerManagers, 'hack.js')
  }

  threadCount(filename) {
    return this.processManager.runningThreadCount(filename, this.target.name)
  }

  findRamAndLaunch(minerManagers, fileType) {
    const ramFinder = new RamFinder(this.ns, this.nmap)
    const [managers, outOfRam] = ramFinder.findMiners(minerManagers)
    const rand = Date.now()

    managers.forEach(manager => this.launchMiners(manager, fileType, rand))
    if ( outOfRam ) {
      throw new OutOfRamException(`Out of ram, targeting ${this.target.name} ` +
        `while trying to run ${fileType}.`)
    }
  }

  launchMiners(minerManager, type, rand) {
    const file = minerManager.type
    const wait = minerManager.delay
    const record = type == minerManager.type
    let pid

    for ( const miner of minerManager.miners ) {
      this.ns.print(`ns.exec('${file}', '${miner.name}', ${miner.threads}, ` +
        `${formatDuration(wait)}, '${this.target.name}', ${rand})`)
      pid = this.ns.exec(file, miner.name, miner.threads, wait, this.target.name, rand)
      if (pid > 0 && record) {
        this.processManager.addProcess(pid, miner.threads, this.target.name, file)
      }
    }
    if (record) recordActivity(file, minerManager.totalThreads)
  }

  hackTime() { return this.ns.formulas.hacking.hackTime(this.target.data, fetchPlayer())}
  growTime() { return this.hackTime() * growTimeMultiplier }
  weakTime() { return this.hackTime() * weakenTimeMultiplier }

  hackInfo() {
    if ( this.target.data.moneyAvailable/this.target.maxMoney < 0.1) return [0,0,0]

    const player = fetchPlayer()
    const formulas = this.ns.formulas.hacking
    const server = this.target.data
    const decimal = getLSItem('hackpercent')
    const amountToHack = server.moneyAvailable * decimal
    const threads = Math.floor(decimal/formulas.hackPercent(server, player))

    this.ns.print(`Hack   : ${formatMoney(amountToHack)} / threads: ${threads} / ` +
      `remaining: ${formatMoney(server.moneyAvailable - amountToHack)} / ` +
      `security: ${formatNumber(serverFortifyAmount*threads)}`)
    return [threads, amountToHack]
  }

  growthInfo(replacing) {
    const player = fetchPlayer()
    const server = this.target.data
    const formulas = this.ns.formulas.hacking

    let multiplier = server.moneyMax/(Math.max(1, server.moneyMax - replacing))
    let threads = Math.ceil((multiplier-1)/(formulas.growPercent(server, 1, player)-1))
    let security = 2 * serverFortifyAmount * threads
    this.ns.print(`Grow   : ${formatNumber(multiplier * 100)}% ` +
      `(${formatMoney(replacing)}) / ` +
      `${threads} threads / security: ${formatNumber(security)}`)
    return threads
  }

  weakenInfo(security) {
    const threads = Math.ceil(security/securityWeakenedPerThread)
    this.ns.print(`Weaken : ${security} / ${threads} threads`)
    return threads
  }
}


class RamFinder {
  constructor(ns, nmap) {
    this.ns = ns
    this.nmap = nmap
    this.serversWithRam = this.findRam()
  }
  findRam() {
    const largestFile = ramSizes['hack.js']
    let availableRam, server, reserved
    const serversWithRam = {}

    for ( const sn in this.nmap ) {
      // sometimes pservs are deleted between getting the nmap and here. catch!
      try { server = this.ns.getServer(sn) } catch { continue }
      reserved = sn == 'home' ? reservedRam : 0
      if ( server.maxRam - server.ramUsed < largestFile + reserved ||
        !this.nmap[sn].files.includes('weaken.js') ||
        getLSItem('decommissioned') == sn ) {
        continue
      }
      availableRam = server.maxRam - server.ramUsed - reserved
      serversWithRam[sn] = { ram: availableRam, netRam: availableRam }
    }

    return serversWithRam
  }
  findMiners(minerManagers, outOfRam = false) {
    minerManagers.forEach((manager) => this.findThreads(manager) )
    if ( minerManagers.every(t => t.completed()) ) {
      return [minerManagers, outOfRam]
    }

    const threads = minerManagers.reduce((t, m) => { return t + m.totalThreads }, 0)
    const currGoals = minerManagers.map(m => m.goal)
    const adjGoals = this.adjustRelative(currGoals, threads)
    // this.ns.print(`${threads} threads / currGoals: ${currGoals} / adjGoals: ${adjGoals}`)
    if (  typeof threads !== 'number' || Number.isNaN(threads) ) throw 'Threads is NaN'
    this.resetServers()
    const adjManagers = minerManagers.map((m, i) => m.adjustGoal(adjGoals[i]) )
    return this.findMiners(adjManagers, true)
  }
  findThreads(manager) {
    let numThreads = manager.goal
    let file = manager.type
    if (numThreads == 0) {
      return manager 
    }
    const fileSize = ramSizes[file]
    let availableThreads, threads, server

    for ( const sn in this.serversWithRam ) {
      server = this.serversWithRam[sn]
      if ( server.netRam < fileSize ) 
        continue
      availableThreads = Math.floor(server.netRam/fileSize)
      threads = Math.min(availableThreads, numThreads)
      numThreads -= threads
      server.netRam -= (threads * fileSize)
      manager.add(sn, threads)
      if (numThreads <= 0) {
        return manager
      }
    }

    return manager
  }

  resetServers() {
    for (const sn in this.serversWithRam) {
      this.serversWithRam[sn].netRam = this.serversWithRam[sn].ram 
    }
  }

  adjustRelative(values, adjustedTotal) {
    // if the adjusted available total is less than 3, it's not worth running
    if (adjustedTotal < values.filter(v => v > 0).length) {
      // return an array of the same length, but all zeroed values
      return new Array(values.length).fill(0)
    }
    let currentTotal = values.reduce((a,b) => a + b)
    let multiplier = adjustedTotal / currentTotal
    return values.map(v => {
      let min = v == 0 ? 0 : 1
      return Math.max(min, Math.floor(v * multiplier))
    })
  }
}

class MinerManager {
  constructor(type, goalThreads, delay) {
    this.type = type
    this.goal = goalThreads
    this.delay = delay
    this.miners = []
    this.totalThreads = 0
  }
  add(name, threads) {
    this.totalThreads += threads
    this.miners.push({ name: name, threads: threads})
  }
  adjustGoal(newGoal) {
    return new MinerManager(this.type, newGoal, this.delay)
  }
  completed() {
    return this.totalThreads >= this.goal
  }
}


class OutOfRamException extends Error {
  constructor(message) {
    super(message)
    this.name = 'OutOfRamException'
  }
}


class ProcessManager {
  constructor() {
    this.threadList = []
  }
  runningThreadCount(type, target) {
    return this.filter(type, target).reduce((t, c) => { return t + c.threads }, 0)
  }
  filter(type, target){
    return this.threadList.filter(p => p.type == type && p.target == target)
  }
  cleanup(ns){
    this.threadList = this.threadList.filter(p => ns.isRunning(p.pid))
  }
  addProcess(pid, threads, target, type) {
    this.threadList.push(new Process(pid, threads, target, type))
  }
}

class Process {
  constructor(pid, threads, target, type) {
    this.pid = pid 
    this.threads = threads
    this.target = target
    this.type = type
  }
}