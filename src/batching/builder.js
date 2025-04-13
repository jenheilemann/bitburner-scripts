import { 
  calcThreadsToGrow, 
  calcThreadsToHack,
  calcRam, ramSizes,
  hackTime, weakTime, growTime, 
  calcHackAmount } from '/batching/calculations.js'

// Game-set constants. Don't change these magic numbers.
const growsPerWeaken = 12.5
const hacksPerWeaken = 25

/** @param {NS} ns */
export async function main(ns) {
  ns.tprint('ERROR: /batching/builder.js is not meant to be run independently.')
}


class BatchTask {
  /**
   * @param {string} type
   * @param {Integer} threads
   * @param {Float} ram
   * @param {Float} time
   */
  constructor(type, threads, ram, time) {
    this.type = type
    this.threads = threads
    this.ram = ram
    this.time = time
    this.servers
  }
}


/**
 * @prop {Server} target
 * @prop {[BatchTask]} tasks
 */
class Builder {
  /**
   * @param {Server} target
   */
  constructor(target) {
    this.target = target
    this.tasks = []
  }

  /**
   * @param {NS} ns
   * @param {[Server]} serversWithRam
   * @returns {[BatchTask]} The tasks with added chosen servers and # of threads
   **/
  assignServers(serversWithRam) {
    this.tasks.forEach(task => {
      let servers = this.matchServers(task, serversWithRam)
      task.servers = servers
    })
    return this.tasks
  }

  /**
   * @returns {boolean} true if all batches have matching servers
   */
  isFulfilled() {
    return this.tasks.every(b => b.servers && b.servers.length > 0)
  }

  /**
   * @returns {boolean} true if all batches have matching servers
   */
  isEmpty() {
    return this.tasks.every(b => !b.servers || b.servers.length == 0)
  }

  /**
   * @returns {Float} GB of ram required to run a full batch
   */
  calcTotalRamRequired() {
    if (this.tasks.length == 0)
      this.calcTasks()

    return this.tasks.reduce((a,b) => a + b.ram, 0)
  }
}

export class PrepBuilder extends Builder {
  type = 'Prepping'

  /**
   * @returns {[BatchTask]} The ram and threads for weaken, grow, weaken until
   *                        the target server is prepped
   *    {
   *      weaken1: {type: weaken, threads: y, time: x}
   *      grow:    {type: grow,   threads: y, time: z},
   *      weaken2: {type: weaken, threads: y, time: x}
   *    }
   **/
  calcTasks() {
    let weakTh1 = Math.ceil(((this.target.hackDifficulty - this.target.minDifficulty) / 0.05))
    let growTh  = calcThreadsToGrow(this.target, this.target.moneyMax) + 1
    let weakTh2 = Math.ceil((growTh/growsPerWeaken))
    this.tasks = [
      new BatchTask('weak', weakTh1, calcRam('weak', weakTh1), weakTime(this.target)),
      new BatchTask('grow', growTh,  calcRam('grow', growTh),  growTime(this.target)),
      new BatchTask('weak', weakTh2, calcRam('weak', weakTh2), weakTime(this.target)),
    ].filter(t => t.threads > 0)
    return this.tasks
  }

  /**
   * @param {BatchTask} task
   * @param {[Server]} serversWithRam
   * @returns {[[string, Int]]} Array where each entry is sub-array of Server
   *                            hostname and number of threads assigned
   **/
  matchServers(task, serversWithRam) {
    serversWithRam.sort((a,b) => a.availableRam - b.availableRam)
    let server = serversWithRam.find(s => s.availableRam >= task.ram)
    if (server) {
      server.availableRam -= task.ram
      return [[server.hostname, task.threads]]
    }
    serversWithRam.sort((a,b) => b.availableRam - a.availableRam)
    let neededThreads = task.threads
    let scriptSize = ramSizes[task.type]
    let servers = []
    serversWithRam.forEach(server => {
      if (neededThreads == 0 ) return

      if (server.availableRam > scriptSize) {
        let useThreads = Math.min(neededThreads, Math.floor(server.availableRam/scriptSize))
        let useRam = useThreads*scriptSize
        server.availableRam -= useRam
        servers.push([server.hostname, useThreads])
        neededThreads -= useThreads
      }
    })
    return servers
  }
}

export class HackBuilder extends Builder {
  type = 'Hacking'

  /**
   * @returns {[BatchTask]} The needed ram and threads for HWGW batch
   **/
  calcTasks() {
    // zero out the server, assume prepping script goes well
    let mA = this.target.moneyAvailable
    let hD = this.target.hackDifficulty
    this.target.moneyAvailable = this.target.moneyMax
    this.target.hackDifficulty = this.target.minDifficulty

    if (this.tasks.length > 0) return this.tasks
    let hackDecimal = calcHackAmount(this.target)
    let hackTh = calcThreadsToHack(this.target, this.target.moneyAvailable * hackDecimal)
    let weakTh1 = Math.ceil(hackTh/hacksPerWeaken)
    this.target.moneyAvailable -= this.target.moneyAvailable*hackDecimal
    let growTh = calcThreadsToGrow(this.target, this.target.moneyMax) + 1
    let weakTh2 = Math.ceil(growTh/growsPerWeaken)
    // reset to actual, especially hackDifficulty before calculating hackTime
    this.target.moneyAvailable = mA
    this.target.hackDifficulty = hD
    this.tasks = [
      new BatchTask('hack', hackTh,  calcRam('hack', hackTh),  hackTime(this.target)),
      new BatchTask('weak', weakTh1, calcRam('weak', weakTh1), weakTime(this.target)),
      new BatchTask('grow', growTh,  calcRam('grow', growTh),  growTime(this.target)),
      new BatchTask('weak', weakTh2, calcRam('weak', weakTh2), weakTime(this.target)),
    ].filter(t => t.threads > 0)

    return this.tasks
  }

  /**
   * @param {BatchTask} task
   * @param {[Server]} serversWithRam
   * @returns {[[string, Int]]} Array where each entry is sub-array of Server
   *                            hostname and number of threads assigned
   **/
  matchServers(task, serversWithRam) {
    serversWithRam.sort((a,b) => a.availableRam - b.availableRam)
    let server = serversWithRam.find(s => s.availableRam >= task.ram)
    if (server) {
      server.availableRam -= task.ram
      return [[server.hostname, task.threads]]
    }

    if (task.type == "weak") {
      serversWithRam.sort((a,b) => b.availableRam - a.availableRam)
      let neededThreads = task.threads
      let scriptSize = ramSizes[task.type]
      let servers = []
      serversWithRam.forEach(server => {
        if (server.availableRam > scriptSize) {
          let useThreads = Math.min(neededThreads, Math.floor(server.availableRam/scriptSize))
          let useRam = useThreads*scriptSize
          server.availableRam -= useRam
          servers.push([server.hostname, useThreads])
          neededThreads -= useThreads
          if (neededThreads == 0 ) {
            return
          }
        }
      })
      return servers
    }
    return []
  }
}

