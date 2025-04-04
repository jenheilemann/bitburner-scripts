import { disableLogs, getLSItem, setLSItem, fetchPlayer } from 'helpers.js'
import { findBestTarget } from 'bestHack.js'
import { networkMapFree, networkMap } from 'network.js'
import { BatchDataQueue } from 'batching/batchJob.js'

// minimum ram required to run each file with 1 thread
// avoid calling getScriptRam
const ramSizes = {
  'hack' : 1.7,
  'weak' : 1.75,
  'grow' : 1.75,
}

const fileNames = {
  'hack' : 'batchHack.js',
  'weak' : 'batchWeaken.js',
  'grow' : 'batchGrow.js',
}

// how much of the server should we hack per batch, ideally?
const hackDecimal = 0.05
// timing margin of error, as ms before the end timestamp
const timingMarginOfError = 50
// how much ram should be set aside on the home server for running the controller etc
const reservedRam = 20
// how many ms between each HWGW file ending
const batchBufferTime = 2

// Game-set constants. Don't change these magic numbers.
const growsPerWeaken = 12.5
const hacksPerWeaken = 25
const growTimeMultiplier = 3.2 // Relative to hacking time. 16/5 = 3.2
const weakenTimeMultiplier = 4 // Relative to hacking time

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep', 'getServerUsedRam', 'getServerMoneyAvailable'])

  let serversWithRam = fetchServersWithRam(ns, ramSizes['weak'])
  if ( serversWithRam.length == 0 ) {
     ns.print("No ram available")
     return;
  }
  // serversWithRam = [networkMapFree()['home']]

  // I can manually override the default percentage, else defaults to hackDecimal
  if ((typeof getLSItem('hackpercent')) != 'number') setLSItem('hackpercent', hackDecimal)

  while ( withinAnyBatchErrorWindow() ) {
    await ns.sleep(batchBufferTime*2)
  }

  let target = findBestTarget()
  // target = networkMapFree()['n00dles']
  // target = networkMapFree()['joesguns']

  ns.print(`isHealthy? ${isHealthy(ns, target)}`)
  ns.print(`needsPrep? ${needsPrep(ns, target, fetchBatchQueue())}`)

  let queue = fetchBatchQueue()
  ns.print(`queue.isEmpty(): ${queue.isEmpty()}`)
  ns.print(`queue.anyInsideErrorWindow(): ${queue.anyInsideErrorWindow()}`)
  ns.print(`queue.hasPreppingScript(${target.hostname}): ${queue.hasPreppingScript(target.hostname)}`)


  let batcher = chooseBatcher(ns, target)
  batcher.calcTasks()
  let jobs = batcher.assignServers(serversWithRam)

  if (!batcher.isFulfilled() && !needsPrep(ns, target, fetchBatchQueue())) {
    ns.print(jobs)
    ns.print("Couldn't find servers to fulfill batch, try later.")
    return
  }

  ns.print(`Ready for launch! Target: ${target.hostname}`)
  await launch(ns,batcher,target.hostname)
}

function hackTime(ns, server) { return ns.getHackTime(server.hostname) }
function growTime(ns, server) { return hackTime(ns, server) * growTimeMultiplier }
function weakTime(ns, server) { return hackTime(ns, server) * weakenTimeMultiplier }

/**
 * @param {NS} ns
 * @param {num} minRam - the smallest amount of ram we might use at once (for hacking)
 **/
function fetchServersWithRam(ns, minRam) {
  return Object.values(networkMapFree()).filter(server =>
      // sometimes pservs are deleted before getting the network map.
      ns.serverExists(server.name) &&
      serverHasEnoughRam(server, minRam) &&
      server.files.includes('batchWeaken.js') &&
      getLSItem('decommissioned') != server.name
  )
}

/**
 * @param {Server} server
 * @param {num} minRam - the smallest amount of ram we might use at once (for hacking)
 * @returns {boolean} Whether the server's unused ram is enough to run one thread of the smallest file
 **/
function serverHasEnoughRam(server, minRam) {
  let reserved = server.name == 'home' ? reservedRam : 0
  let available = server.availableRam - reserved
  return available > minRam
}

/**
 * @returns {boolean} Is the current time within the error window of another
 *                    batch that is ending?
 **/
function withinAnyBatchErrorWindow() {
  let batchDataQueue = fetchBatchQueue()

  if ( batchDataQueue.isEmpty() ) { return false }

  return batchDataQueue.anyInsideErrorWindow()
}

/**
 * @param {NS} ns
 * @param {Server} targetServer
 * @returns {Batcher}
 **/
function chooseBatcher(ns, targetServer) {
  if (needsPrep(ns, targetServer, fetchBatchQueue())) {
    return new PrepBatcher(ns, targetServer)
  }
  return new HackBatcher(ns, targetServer)
}

class BatchTask {
  constructor(type, threads, ram, time) {
    this.type = type
    this.threads = threads
    this.ram = ram
    this.time = time
    this.servers
  }
}


class Batcher {
  constructor(ns, target) {
    this.ns = ns;
    this.target = target;
    this.tasks = []
  }

  /**
   * @param {array[Server]} serversWithRam
   * @returns {obj[obj]} The threads with added chosen servers and # of threads
   **/
  assignServers(serversWithRam) {
    serversWithRam.map(s => {
      let reserved = s.hostname == 'home' ? reservedRam : 0
      s.availableRam = s.maxRam - this.ns.getServerUsedRam(s.hostname) - reserved
    })

    this.tasks.forEach(task => {
      let servers = this.matchServers(task, serversWithRam)
      if ( !servers ) return
      task.servers = servers.map(s => [s.hostname, s.threads])
    })
    return this.tasks
  }

  /**
   * @returns {boolean} true if all batches have matching servers
   */
  isFulfilled() {
    return this.tasks.every(b => b.servers && b.servers.length > 0)
  }
}

class PrepBatcher extends Batcher {
  type = 'Prepping'

  /**
   * @returns {array[BatchTask]} The ram and threads for grow, weaken until the target is prepped
   *    {
   *      grow:    {type: grow,   threads: y, time: longest + 0},
   *      weaken2: {type: weaken, threads: y, time: longest + 1}
   *    }
   **/
  calcTasks() {
    if (this.tasks.length > 0 ) return this.tasks
    let weakTh1 = Math.ceil(((this.target.hackDifficulty - this.target.minDifficulty) / 0.05))
    let growTh  = calcThreadsToGrow(this.target, this.target.moneyMax)
    let weakTh2 = Math.ceil((growTh/growsPerWeaken))
    this.tasks = [
      new BatchTask('weak', weakTh1, calcRam('weak', weakTh1), weakTime(this.ns, this.target)),
      new BatchTask('grow', growTh,  calcRam('grow', growTh),  growTime(this.ns, this.target)),
      new BatchTask('weak', weakTh2, calcRam('weak', weakTh2), weakTime(this.ns, this.target)),
    ].filter(t => t.threads > 0)
    return this.tasks
  }

  /**
   * @param {obj} task
   * @param {array[Servers]} serversWithRam
   * @returns {array[Servers]} Servers with available ram adjusted and number of threads recorded
   **/
  matchServers(task, serversWithRam) {
    serversWithRam.sort((a,b) => a.availableRam - b.availableRam)
    let server = serversWithRam.find(s => s.availableRam >= task.ram)
    if (server) {
      server.threads = task.threads
      server.availableRam -= task.ram
      return [server]
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
        server.threads = useThreads
        server.availableRam -= useRam
        servers.push(server)
        neededThreads -= useThreads
      }
    })
    return servers
  }
}

class HackBatcher extends Batcher {
  type = 'Hacking'

  /**
   * @returns {array[BatchTask]} The needed ram and threads for HWGW batch
   **/
  calcTasks() {
    if (this.tasks.length > 0) return this.tasks
    let hackTh = calcThreadsToHack(this.target, this.target.moneyAvailable * hackDecimal)
    let weakTh1 = Math.ceil(hackTh/hacksPerWeaken)
    this.target.moneyAvailable -= this.target.moneyAvailable*hackDecimal
    let growTh = calcThreadsToGrow(this.target, this.target.moneyMax)
    let weakTh2 = Math.ceil(growTh/growsPerWeaken)
    this.tasks = [
      new BatchTask('hack', hackTh,  calcRam('hack', hackTh),  hackTime(this.ns, this.target)),
      new BatchTask('weak', weakTh1, calcRam('weak', weakTh1), weakTime(this.ns, this.target)),
      new BatchTask('grow', growTh,  calcRam('grow', growTh),  growTime(this.ns, this.target)),
      new BatchTask('weak', weakTh2, calcRam('weak', weakTh2), weakTime(this.ns, this.target)),
    ].filter(t => t.threads > 0)
    return this.tasks
  }

  /**
   * @param {obj} task
   * @param {array[Servers]} serversWithRam
   * @returns {array[Servers]} Servers with available ram adjusted and number of threads recorded
   **/
  matchServers(task, serversWithRam) {
    serversWithRam.sort((a,b) => a.availableRam - b.availableRam)
    let server = serversWithRam.find(s => s.availableRam >= task.ram)
    if (server) {
      server.threads = task.threads
      server.availableRam -= task.ram
      return [server]
    }

    if (task.type == "weak ") {
      serversWithRam.sort((a,b) => b.availableRam - a.availableRam)
      let neededThreads = task.threads
      let scriptSize = ramSizes[task.type]
      let servers = []
      serversWithRam.forEach(server => {
        if (server.availableRam > scriptSize) {
          let useThreads = Math.min(neededThreads, Math.floor(server.availableRam/scriptSize))
          let useRam = useThreads*scriptSize
          server.threads = useThreads
          server.availableRam -= useRam
          servers.push(server)
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


/**
 * @returns {BatchDataQueue} For working with upcoming batches
 */
function fetchBatchQueue() {
  let rawData = getLSItem('batches') ?? []
  let batchDataQueue = new BatchDataQueue(rawData)
  batchDataQueue.discardExpiredBatchData()
  return batchDataQueue
}

/**
 * Saves the batch to the list
 * @returns {null}
 */
function recordBatch(start, end, id, longestTime, type, target) {
  let queue = fetchBatchQueue()
  queue.addNewJob(start, end, id, longestTime, type, target)
  setLSItem('batches', queue.toObj())
}


/**
 * @param {NS} ns
 * @param {Server} server
 * @param {BatchDataQueue} batchDataQueue
 * @returns {boolean} Whether the server is grown to max and weakened enough
 **/
function needsPrep(ns, server, batchDataQueue) {
  return !isHealthy(ns, server) && !batchDataQueue.hasPreppingScript(server.hostname)
}

/**
 * @param {NS} ns
 * @param {Server} server
 * @returns {boolean} Whether the server is grown to max and weakened enough
 **/
function isHealthy(ns, server) {
  return ns.getServerMoneyAvailable(server.hostname) >= (server.moneyMax - 0.01) && server.hackDifficulty < (server.minDifficulty + 0.0001)
}


/**
 * @param {string} type
 * @param {num} numThreads
 * @returns {num} Amount of ram needed to run that many of that type of action
 **/
function calcRam(type, numThreads) {
  return ramSizes[type] * numThreads
}

/**
 * @param {NS} ns
 * @param {obj} batchServers
 * @param {string} target
 * @returns {null}
 */
async function launch(ns, batcher, target) {
  let pids = []
  let batchID = fetchNextBatchID()
  ns.print(`batch id: ${batchID}`)
  for (let job of batcher.tasks) {
    ns.print(job)
    let args = { id: batchID, time: job.time, type: job.type, target: target }
    if (job.threads == 0) continue

    job.servers.forEach(server => {
      pids.push([ns.exec(fileNames[job.type], server[0], server[1], JSON.stringify(args)), job.time])
    })
  }

  if ( pids.some(p => p == 0) ) {
    ns.tprint(`ERROR: One or more pids was zero! Canceling other jobs in batch ${jobID}.`)
    pids.forEach(pid => pid == 0 ? null : ns.kill(pid))
    return
  }

  ns.print(pids)
  await ns.sleep(3)
  let longestTime = Math.max(...batcher.tasks.map(t => t.time))
  let endTime = performance.now() + longestTime
  let pad = 0
  pids.forEach(pid => {
    ns.print(`ns.writePort(${pid}, ${endTime + pad})`)
    ns.writePort(pid[0], endTime + pad)
    pad += batchBufferTime
  })
  ns.print(`recordBatch(start, end, id, longestTime, type, target)`)
  ns.print(`recordBatch(${endTime-batchBufferTime}, ${endTime+pad}, ${batchID}, ${longestTime}, ${batcher.type}, ${target})`)
  recordBatch(endTime-batchBufferTime, endTime+pad, batchID, longestTime, batcher.type, target)
}

/**
 * @returns {num} Next batch ID number, probably unique
 */
function fetchNextBatchID() {
  let lastID = parseInt( (getLSItem('batchJobId') ?? 0), 16 )
  let nextID = lastID + 1
  if ( nextID > 9_999_999_999_999 ) { nextID = 1 }
  setLSItem('batchJobId', nextID.toString(16))
  return nextID.toString(16)
}

/**
 * Returns the number of threads needed to grow the specified server by
 * the specified amount.
 * @param {Server} server - Server being grown
 * @param {num} targetMoney - - How much you want the server grown TO (not by),
 *                        for instance, to grow from 200 to 600, input 600
 * @returns {num} Number of threads needed
 */
function calcThreadsToGrow(server, targetMoney) {
  let person = fetchPlayer()
  let startMoney = server.moneyAvailable

  const k = calculateServerGrowthLog(server, 1, person);
  const guess = (targetMoney - startMoney) / (1 + (targetMoney * (1 / 16) + startMoney * (15 / 16)) * k);
  let x = guess;
  let diff;
  do {
    const ox = startMoney + x;
    // Have to use division instead of multiplication by inverse, because
    // if targetMoney is MIN_VALUE then inverting gives Infinity
    const newx = (x - ox * Math.log(ox / targetMoney)) / (1 + ox * k);
    diff = newx - x;
    x = newx;
  } while (diff < -1 || diff > 1);
  /* If we see a diff of 1 or less we know all future diffs will be smaller, and the rate of
   * convergence means the *sum* of the diffs will be less than 1.

   * In most cases, our result here will be ceil(x).
   */
  const ccycle = Math.ceil(x);
  if (ccycle - x > 0.999999) {
    // Rounding-error path: It's possible that we slightly overshot the integer value due to
    // rounding error, and more specifically precision issues with log and the size difference of
    // startMoney vs. x. See if a smaller integer works. Most of the time, x was not close enough
    // that we need to try.
    const fcycle = ccycle - 1;
    if (targetMoney <= (startMoney + fcycle) * Math.exp(k * fcycle)) {
      return fcycle;
    }
  }
  if (ccycle >= x + ((diff <= 0 ? -diff : diff) + 0.000001)) {
    // Fast-path: We know the true value is somewhere in the range [x, x + |diff|] but the next
    // greatest integer is past this. Since we have to round up grows anyway, we can return this
    // with no more calculation. We need some slop due to rounding errors - we can't fast-path
    // a value that is too small.
    return ccycle;
  }
  if (targetMoney <= (startMoney + ccycle) * Math.exp(k * ccycle)) {
    return ccycle;
  }
  return ccycle + 1
}


// Returns the log of the growth rate. When passing 1 for threads, this gives a useful constant.
function calculateServerGrowthLog(server, threads, p, cores = 1) {
  if (!server.serverGrowth) return -Infinity;
  const hackDifficulty = server.hackDifficulty ?? 100;
  const numServerGrowthCycles = Math.max(threads, 0);

  const serverBaseGrowthIncr = 0.03 // Unadjusted growth increment (growth rate is this * adjustment + 1)
  const serverMaxGrowthLog = 0.00349388925425578 // Maximum possible growth rate accounting for server security, precomputed as log1p(.0035)

  //Get adjusted growth log, which accounts for server security
  //log1p computes log(1+p), it is far more accurate for small values.
  let adjGrowthLog = Math.log1p(serverBaseGrowthIncr / hackDifficulty);
  if (adjGrowthLog >= serverMaxGrowthLog) {
    adjGrowthLog = serverMaxGrowthLog;
  }

  //Calculate adjusted server growth rate based on parameters
  const serverGrowthPercentage = server.serverGrowth / 100;
  const serverGrowthPercentageAdjusted = serverGrowthPercentage * getLSItem('bitnode')['ServerGrowthRate'];

  //Apply serverGrowth for the calculated number of growth cycles
  const coreBonus = 1 + (cores - 1) * (1 / 16);
  // It is critical that numServerGrowthCycles (aka threads) is multiplied last,
  // so that it rounds the same way as numCycleForGrowth.
  return adjGrowthLog * serverGrowthPercentageAdjusted * p.mults.hacking_grow * coreBonus * numServerGrowthCycles;
}

/**
 * @params {Server} server
 * @params {num} hackAmount - how much money to get with this hack, as a dollar amount
 * @returns {num} the number of threads to hack with to get about this amount
 */
function calcThreadsToHack(server, hackAmount) {
  if (hackAmount < 0 || hackAmount > server.moneyAvailable) {
    return -1;
  }

  const percentHacked = calculatePercentMoneyHacked(server)
  return Math.floor(hackAmount / (server.moneyAvailable * percentHacked))
}

/**
 * Returns the percentage of money that will be stolen from a server if
 * it is successfully hacked (returns the decimal form, not the actual percent value)
 */
function calculatePercentMoneyHacked(server) {
  // Adjust if needed for balancing. This is the divisor for the final calculation
  const balanceFactor = 240;
  const player = fetchPlayer()

  const difficultyMult = (100 - server.hackDifficulty) / 100;
  const skillMult = (player.skills.hacking - (server.requiredHackingSkill - 1)) / player.skills.hacking;
  const percentMoneyHacked = (difficultyMult * skillMult * player.mults.hacking_money) / balanceFactor;
  if (percentMoneyHacked < 0) {
    return 0;
  }
  if (percentMoneyHacked > 1) {
    return 1;
  }

  let scriptHackMoneyMult = getLSItem('bitnode')["ScriptHackMoney"]
  return percentMoneyHacked * scriptHackMoneyMult
}
