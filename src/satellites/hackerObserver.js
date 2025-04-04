import {
  disableLogs,
  fetchPlayer,
  getNsDataThroughFile_Custom as fetch,
  getLSItem, setLSItem,
  formatDuration, formatNumber, formatMoney,
} from 'helpers.js'
import { networkMap } from 'network.js'
import { BestHack } from 'bestHack.js'

// avoid calling getScriptRam
const ramSizes = {
  'hack.js'   : 1.7,
  'weaken.js' : 1.75,
  'grow.js'   : 1.75,
}

// Configuration. Change these as desired.
const reservedRam = 50
const bufferTime = 30 //ms
const hackDecimal = 0.05 // how much of the server should we hack before growing?
const sleepTime = 1000 //ms

// Game-set constants. Don't change these magic numbers.
const securityWeakenedPerThread = 0.05
const serverFortifyAmount = 0.002
const growTimeMultiplier = 3.2 // Relative to hacking time. 16/5 = 3.2
const weakenTimeMultiplier = 4 // Relative to hacking time

let reporter; // bad global, bad!

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['exec', 'sleep'])
  let nmap, player, searcher, targets
  const processManager = new ProcessManager()

  if ((typeof getLSItem('hackpercent')) != 'number') setLSItem('hackpercent', hackDecimal)

  while(true) {
    nmap = networkMap(ns)
    player = fetchPlayer()
    processManager.cleanup(ns)
    reporter = new Report()
    searcher = new BestHack(nmap)
    targets = searcher.findTop(player.skills.hacking)
    // if ( targets.some(s => s.name === 'joesguns') && targets[0].name != 'joesguns' ) {
    //   targets = targets.filter(s => s.name != 'joesguns')
    //   targets.splice(1, 0, await fetchServer(ns, 'joesguns'))
    // }

    for (let server of targets) {
      try {
        ns.print(`INFO: Targeting ${server.name} ......................`)
        await targetServer(ns, server, nmap, processManager)
      }
      catch(err) {
        if ( err instanceof OutOfRamException ) {
          ns.print(`WARNING: ${err}`)
          break
        }
        throw err
      }
    }
    ns.print(reporter.output(ns, targets, processManager))
    await ns.sleep(sleepTime)
  }
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
  output(ns, servers, processManager) {
    let str = 'SUCCESS: ---------- '
    str += this.processSummary(processManager)
    str += this.activitySummary()
    str += this.serverSummary(ns, servers, processManager)
    return str
  }
  // N.B.: The threads listed here and in activitySummary are the PRIMARY
  // ACTIVITY threads. IE, if the script is weakening the server because
  // security is too high, those threads will be counted; if the script is
  // weakening the server because it is running an associated grow or hack,
  // those weak threads are not counted (only the grow or hack threads).
  processSummary(processManager) {
    let str = '\n\r Ongoing:   '
    const summaryData = processManager.summaryData()
    const total = summaryData.reduce((t, a) => { return t + a.threads}, 0)
    str += `${total.toString().padStart(6)} total `
    summaryData.forEach(d =>
      str += `${d.threads.toString().padStart(5)}${d.type} threads ` +
        `(${d.servers.toString().padStart(2)} servers) `
    )
    return str
  }

  activitySummary() {
    let str = '\n\r This cycle:'
    const activity = Object.values(this.activity)
    const totalThreads = activity.reduce((t, a) => { return t + a.threads }, 0)
    str += `${totalThreads.toString().padStart(6)} total `
    activity.forEach( a =>
      str += `${a.threads.toString().padStart(5)}${a.type} threads ` +
        `(${a.servers.toString().padStart(2)} servers) `
    )
    return str
  }

  serverSummary(ns, servers, processManager) {
    const top = servers.slice(0,5)
    const nameLength = Math.max(... top.map(t => t.name.length))
    let str = '\n\r '
    str += ''.padStart(nameLength,'-')
    str += ' Top targets ---------------------------------'
    str += ' | Ongoing Threads:'
    str += `\n\r ` + `Name`.padEnd(nameLength)
    str += ` |  Sec/min    |  Money/max          | wTime   |     weak   grow   hack`
    for (const server of top ) {
      str += `\n\r ${server.name.padEnd(nameLength)} | ` +
        `${formatNumber(server.security).padStart(5)}/` +
        `${formatNumber(server.minSecurity).padEnd(5)} | ` +
        `${formatMoney(server.data.moneyAvailable).padStart(9)}/` +
        `${formatMoney(server.maxMoney).padEnd(9)} | ` +
        // `${formatDuration(ns.formulas.hacking.weakenTime(server.data, fetchPlayer())).padEnd(7)} | ` +
        `${processManager.runningThreadCount('weaken.js', server.name)}`.padStart(8) +
        `${processManager.runningThreadCount('grow.js', server.name)}`.padStart(7) +
        `${processManager.runningThreadCount('hack.js', server.name)}`.padStart(7)

    }
    return str
  }
}

/**
 * @param {NS} ns
 * @param {object} target - server to attempt to target
 * @param {object} nmap - network map of all servers
 * @param {object} processManager - manages what processes are running
 **/
async function targetServer(ns, target, nmap, processManager) {
  ns.print(`Security: ${formatNumber(target.security)}/${formatNumber(target.minSecurity)} ----- ` +
    `Money: ${formatMoney(target.moneyAvailable)}/${formatMoney(target.maxMoney)}`)
  ns.print("Target: " + target.name + ", nmap: " + Object.keys(nmap).length + ", processManager: " + processManager.threadList.length)
  const targeter = new Targeter(ns, target, nmap, processManager)
  targeter.weakenServer()
  await targeter.growServer()
  await targeter.hackServer()
}

class Targeter {
  constructor(ns, target, nmap, processManager) {
    this.ns = ns
    this.target = target
    this.nmap = nmap
    this.processManager = processManager
    ns.print(`H: ${formatDuration(this.hackTime())}, ${this.threadCount('hack.js')} threads | ` +
      `G: ${formatDuration(this.growTime())}, ${this.threadCount('grow.js')} | ` +
      `W: ${formatDuration(this.weakTime())}, ${this.threadCount('weaken.js')}`)
  }

  weakenServer() {
    // If the server is weak enough, then don't worry about weakening more
    if ( this.target.security < this.target.minSecurity + 2 ) {
      return
    }
    const security = this.target.security - this.target.minSecurity
    let threads = this.weakenInfo(security)
    threads = threads - this.threadCount('weaken.js')
    if ( threads < 1 )  {
      return
    }

    this.ns.print(`Weaken : ${formatNumber(security)} | ${threads} threads (+${this.threadCount('weaken.js')} running)`)
    const minerManager = [
      new MinerManager('weaken.js', threads, 0)
    ]
    this.findRamAndLaunch(minerManager, 'weaken.js')
  }

  async growServer() {
    // If the server has enough money available
    if ( this.target.moneyAvailable > this.target.maxMoney * 0.9 ) {
      return
    }

    // adjust money available by current threads multiplying the money
    let adjustedMoney = await this.adjustedMoneyAvailable()
    if ( adjustedMoney >= this.target.maxMoney * 0.99 ) {
      return
    }

    const replacing = this.target.maxMoney - adjustedMoney
    let [growThreads, multiplier] = await this.growthInfo(replacing)
    if ( growThreads < 1 ) {
      return
    }
    // cap grow threads at a time so compounding works in our favor
    growThreads = Math.min(1000, growThreads)

    let security = 2 * serverFortifyAmount * growThreads
    this.ns.print(`Grow   : ${formatNumber(multiplier * 100)}% ` +
      `(${formatMoney(replacing)}) | ` +
      `${growThreads} threads (+${this.threadCount('grow.js')} running) | ` +
      `security: ${formatNumber(security)}`)

    const weakThreads = this.weakenInfo(security)
    const minerManagers = [
      new MinerManager('grow.js', growThreads, this.weakTime()-this.growTime()+bufferTime),
      new MinerManager('weaken.js', weakThreads, 0)
    ]
    this.findRamAndLaunch(minerManagers, 'grow.js')
  }

  async hackServer() {
    // if security or money are too far out of bounds, move on to another server
    if ( this.target.security >= this.target.minSecurity + 2 ) {
      return
    }
    if ( this.target.moneyAvailable <= this.target.maxMoney * 0.5 ) {
      return
    }

    let [hackThreads, hackedMoney] = this.hackInfo()
    this.ns.print(`Hack   : ${formatMoney(hackedMoney)} | threads: ${hackThreads} | ` +
      `remaining: ${formatMoney(this.target.moneyAvailable - hackedMoney)} | ` +
      `security: ${formatNumber(serverFortifyAmount*hackThreads)}`)

    if (hackThreads < 1) return
    let replace = Math.max(1, hackedMoney)

    let [growThreads, _] = await this.growthInfo( replace )
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
      // this.ns.print(`ns.exec('${file}', '${miner.name}', ${miner.threads}, ` +
      //   `${formatDuration(wait)}, '${this.target.name}', ${rand})`)
      pid = this.ns.exec(file, miner.name, miner.threads, wait, this.target.name, rand)
      if (pid > 0 && record) {
        this.processManager.addProcess(pid, miner.threads, this.target.name, file)
      }
    }
    if (record) recordActivity(file, minerManager.totalThreads)
  }

  hackTime() { return this.ns.getHackTime(this.target.hostname) }
  growTime() { return this.hackTime() * growTimeMultiplier }
  weakTime() { return this.hackTime() * weakenTimeMultiplier }

  async hackInfo() {
    if ( this.target.moneyAvailable/this.target.maxMoney < 0.1) return [0,0,0]

    const player = fetchPlayer()
    const server = this.target
    const decimal = getLSItem('hackpercent')
    var percent
    try {
      percent = this.ns.formulas.hacking.hackPercent(server, player)
    } catch(err) {
      percent = await fetch(this.ns, (f,...args) => this.ns.exec(f, "home", ...args), this.ns.isRunning,
                            `ns.hackAnalyze('${server.hostname}')`,
                            "/Temp/hackAnalyze-data.txt",false )
    }
    const threads = Math.ceil(decimal/percent)
    const amountHacked = Math.min(this.target.maxMoney, threads * percent * server.moneyAvailable)

    return [threads, amountHacked]
  }

  async adjustedMoneyAvailable() {
    let growPercnt = await this.getGrowPercent(this.target)
    let alreadyGrowingBy = growPercnt * this.threadCount('grow.js')
    return this.target.moneyAvailable * alreadyGrowingBy
  }

  async growthInfo(replacing) {
    let multiplier = this.target.moneyMax/(Math.max(1, this.target.moneyMax - replacing))
    let growPercnt = await this.getGrowPercent()

    const threads = Math.log(multiplier)/Math.log(growPercnt)
    return [Math.ceil(threads), multiplier]
  }

  async getGrowPercent() {
    try {
      const player = fetchPlayer()
      return this.ns.formulas.hacking.growPercent(this.target, 1, player)
    } catch (err) {
      var threadsper1 = this.ns.growthAnalyze(this.target.hostname, 1)
      this.ns.print("Threads per 1:" + threadsper1)
      // var threadsper1 = await  fetch(this.ns, (f,...args) => this.ns.exec(f, "home", ...args), this.ns.isRunning,
      //                               `ns.growthAnalyze('${this.target.hostname}', 1)`,
      //                               "/Temp/growthanalyze-data.txt",
      //                               false)
      return 1.0/threadsper1
    }
  }

  weakenInfo(security) {
    const threads = Math.ceil(security/securityWeakenedPerThread)
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
      server = this.nmap[sn]
      // sometimes pservs are deleted between getting the nmap and here. catch!
      if ( !this.ns.serverExists(sn) ) { continue }
      reserved = sn == 'home' ? reservedRam : 0
      if ( server.maxRam - server.ramUsed < largestFile + reserved ) {
        // this.ns.print(`not enough ram: ${sn}`);
        continue;
      }
      if ( !this.nmap[sn].files.includes('weaken.js')) {
        // this.ns.print(`files not exists: ${sn}`);
        continue;
      }
      if ( getLSItem('decommissioned') == sn ) {
        // this.ns.print(`server decommissioned: ${sn}`);
        continue
      }

      availableRam = server.maxRam - server.ramUsed - reserved
      // this.ns.print(`server available: ${sn} ${availableRam}`);
      serversWithRam[sn] = { ram: availableRam, netRam: availableRam }
    }

    // this.ns.print(`servers available: ${Object.keys(serversWithRam)}`);
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
  summaryData() {
    const summary = {
      'weaken.js': { type: 'w', threads: 0, servers: 0, serverNames: []},
      'grow.js':   { type: 'g', threads: 0, servers: 0, serverNames: []},
      'hack.js':   { type: 'h', threads: 0, servers: 0, serverNames: []},
    }
    this.threadList.forEach(p => {
      summary[p.type].threads += p.threads
      if (!summary[p.type].serverNames.includes(p.target)) {
        summary[p.type].servers++
        summary[p.type].serverNames.push(p.target)
      }
    })
    return Object.values(summary)
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
