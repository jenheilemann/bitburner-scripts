import { disableLogs,
         getLSItem, setLSItem,
         fetchPlayer
       } from 'helpers.js'
import { BestHack } from 'bestHack.js'
import { networkMapFree, networkMap } from 'network.js'
import { reservedRam } from 'constants.js'
import { BatchDataQueue } from '/batching/queue.js'
import { PrepBuilder, HackBuilder } from '/batching/builder.js'
import { weakTime,
         ramSizes,
         calcHackAmount,
        } from '/batching/calculations.js'


const fileNames = {
  'hack' : 'batchHack.js',
  'weak' : 'batchWeaken.js',
  'grow' : 'batchGrow.js',
}

// how many ms between each HWGW file ending
const batchBufferTime = 10

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep', 'getServerUsedRam', 'getServerMoneyAvailable'])
  ns.clearLog();
  ns.print('Running batchObserver')

  let serversWithRam = fetchServersWithRam(ns, ramSizes['weak'])
  if ( serversWithRam.length == 0 ) {
     ns.print("No ram available")
     return;
  }
  // serversWithRam = [networkMapFree()['home']]

  let target = findBestTarget(ns)
  // let target = networkMapFree()['joesguns']
  if (!target) {
    ns.print(`No target found, best wait til next time....`)
    return
  }

  let queue = fetchBatchQueue()
  ns.print(`queue.isEmpty(): ${queue.isEmpty()}`)
  ns.print(`queue.anyInsideErrorWindow('${target.hostname}'): ${queue.anyInsideErrorWindow(target.hostname)}`)


  while ( withinAnyBatchErrorWindow(target.hostname, performance.now()) ) {
    ns.print("Within batch error window, waiting....")
    await ns.sleep(batchBufferTime*2)
  }

  ns.print(`queue.hasPreppingScript(${target.hostname}): ${queue.hasPreppingScript(target.hostname)}`)
  ns.print(`isHealthy? ${isHealthy(ns, target)}`)
  ns.print(`needsPrep? ${needsPrep(ns, target, fetchBatchQueue())}`)


  let batcher = chooseBatcher(ns, target)
  batcher.calcTasks()
  serversWithRam = fetchServersWithRam(ns, ramSizes['weak'])
  let jobs = batcher.assignServers(serversWithRam)
  let hackDecimal = calcHackAmount(target)

  if (!batcher.isFulfilled() && batcher.type == 'Hacking') {
    if (queue.isEmpty()) {
      ns.print("Not enough ram for a full batch, recalculating....")
      while(!batcher.isFulfilled() && hackDecimal > 0.01) {
        hackDecimal = hackDecimal*0.95
        batcher.calcTasks()
        serversWithRam = fetchServersWithRam(ns, ramSizes['weak'])
        jobs = batcher.assignServers(serversWithRam)
      }
      if (!batcher.isFulfilled()) {
        ns.print(`Some ram found... at ${hackDecimal*100}% hacking.`)
        ns.print(jobs)
      } else {
        ns.print(`Ram found! at ${hackDecimal*100}% hacking.`)
        ns.print(jobs)
      }
    } else {
      ns.print(jobs)
      ns.print("Couldn't find servers to fulfill batch, try later.")
      return
    }
  }

  if (batcher.isEmpty()) {
    ns.print("Found zero ram to fulfill tasks, try again later....")
    return
  }

  ns.print(`Ready for launch! Target: ${target.hostname}`)
  await launch(ns,batcher,target.hostname)
}

/**
 * @param {NS} ns
 * @param {num} minRam - the smallest amount of ram we might use at once (for hacking)
 **/
function fetchServersWithRam(ns, minRam) {
  return Object.values(networkMapFree()).filter(server =>
      // sometimes pservs are deleted before getting the network map.
      ns.serverExists(server.hostname) &&
      serverHasEnoughRam(ns, server, minRam) &&
      server.files.includes('batchWeaken.js') &&
      getLSItem('decommissioned') != server.hostname
  )
}

/**
 * @param {NS} ns
 * @param {Server} server
 * @param {num} minRam - the smallest amount of ram we might use at once (for hacking)
 * @returns {boolean} Whether the server's unused ram is enough to run one thread of the smallest file
 **/
function serverHasEnoughRam(ns, server, minRam) {
  let reserved = server.hostname == 'home' ? reservedRam : 0
  server.availableRam = server.maxRam - ns.getServerUsedRam(server.hostname)
  let available = server.availableRam - reserved
  return available > minRam
}

/**
 * @param {string} hostname - name of the server we're targeting
 * @param {num} timestamp - time to check if we're within the window
 * @returns {boolean} Is the current time within the error window of another
 *                    batch that is ending?
 **/
function withinAnyBatchErrorWindow(hostname, timestamp) {
  let batchDataQueue = fetchBatchQueue()

  if ( batchDataQueue.isEmpty() ) { return false }

  return batchDataQueue.anyInsideErrorWindow(hostname, timestamp)
}


/**
 * Returns a server object that's probably the best one to send a batch against
 * right now, maybe?
 * @param {NS} ns
 **/
export function findBestTarget(ns) {
  let map = getLSItem('nmap')
  if (! map || map.length == 0 ) {
    throw new Error("No network map exists, BestHack can't work.")
  }
  if (ns.args[0] && map[ns.args[0]]) {
    return map[ns.args[0]]
  }
  let hackingSkill = fetchPlayer().skills.hacking
  let searcher = new BestHack(map)
  let servers = searcher.findTop(hackingSkill)
  ns.print(`Servers that make some kinda sense to hack`)
  ns.print(servers.map(s => s.hostname))
  let batchData = fetchBatchQueue()
  let maxTimeInMinutes = ((hacking) => {
    switch(true) {
      case hacking > 2000:
        return 20
      case hacking > 800:
        return 15
      case hacking > 500:
        return 10
      case hacking > 200:
        return 5
      default:
        return 3
    }
  })(hackingSkill)

  for (let server of servers) {
    // weaktime longer than 5 minutes, we only want to prep it;
    // focus on hacking other servers
    let timeCalc
    if ( weakTime(server) > maxTimeInMinutes * 60 * 1000 ) {
      if ( needsPrep(ns, server, batchData) ){
        return server
      }
      ns.print("continuing....")
      continue
    }
    return server
  }
  return false
}

/**
 * @param {NS} ns
 * @param {Server} targetServer
 * @returns {Batcher}
 **/
function chooseBatcher(ns, targetServer) {
  if (needsPrep(ns, targetServer, fetchBatchQueue())) {
    return new PrepBuilder(targetServer)
  }
  return new HackBuilder(targetServer)
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
 * @param {NS} ns
 * @param {obj} batchServers
 * @param {string} target
 * @returns {null}
 */
async function launch(ns, batcher, target) {
  let batchID = fetchNextBatchID()
  ns.print(`batch id: ${batchID}`)
  for (let job of batcher.tasks) {
    ns.print(job)
    let args = { id: batchID, time: job.time, target: target }
    if (job.threads == 0) continue
    job.pids = []
    job.servers.forEach(server => {
      job.pids.push(ns.exec(fileNames[job.type], server[0], server[1], JSON.stringify(args)))
    })
  }

  if ( batcher.tasks.some(t => t.pids.some(p => p == 0)) && batcher.type != 'Prepping') {
    ns.tprint(`ERROR: One or more pids was zero! Canceling other jobs in batch ${batchID}.`)
    for (let job of batcher.tasks) {
      job.pids.forEach(pid => pid == 0 ? null : ns.kill(pid))
    }
    return
  }

  ns.print(batcher.tasks.map(t => t.pids))
  await ns.sleep(2)
  let longestTime = Math.max(...batcher.tasks.map(t => t.time)) + batchBufferTime

  while ( withinAnyBatchErrorWindow(target.hostname, performance.now() + longestTime) ) {
    ns.print("Within batch error window, waiting to launch....")
    await ns.sleep(2)
  }

  let errorWindowStartTime = performance.now() + longestTime
  for (let job of batcher.tasks) {
    for (let pid of job.pids) {
      ns.print(`Prompting PID ${pid}....`)
      while(! ns.getScriptLogs(pid).some(l => l.includes("Waiting for port write")) ) {
        ns.print(`_____ Waiting for PID ${pid} to be ready.`)
        await ns.sleep(1)
      }
      ns.print(`ns.writePort(${pid}, ${performance.now() + longestTime})`)
      ns.writePort(pid, performance.now() + longestTime)
    }
    longestTime += batchBufferTime
  }
  ns.print(`recordBatch(start, end, id, longestTime, type, target)`)
  ns.print(`recordBatch(${errorWindowStartTime}, ${performance.now() + longestTime}, ${batchID}, ${longestTime}, ${batcher.type}, ${target})`)
  recordBatch(errorWindowStartTime, performance.now() + longestTime, batchID, longestTime, batcher.type, target)
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
