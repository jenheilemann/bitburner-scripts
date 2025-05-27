import { disableLogs,
         getLSItem, setLSItem,
         fetchPlayer
       } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { reservedRam } from 'utils/constants.js'
import { BatchDataQueue } from '/batching/queue.js'
import { PrepBuilder, HackBuilder } from '/batching/shotgunBuilder.js'
import { weakTime, growTime, hackTime,
         ramSizes,
         calcHackAmount,
        } from '/batching/calculations.js'

const argsSchema = [
  ['target', 'joesguns']
]

export function autocomplete(data, args) {
  data.flags(argsSchema)
  const lastFlag = args.length > 1 ? args[args.length - 2] : null;
  if (lastFlag == "--target")
    return data.servers;
  return []
}

/** @param {NS} ns */
export async function main(ns) {
  disableLogs(ns, ['sleep', 'getServerUsedRam', 'getServerMoneyAvailable'])
  const flags = ns.flags(argsSchema)
  ns.clearLog();
  ns.print('Running shotgunBatcher...')

  const serversWithRam = fetchServersWithRam(ns, ramSizes['weak'])
  if ( serversWithRam.length == 0 ) {
    ns.print("No ram available")
    return
  }

  const target = networkMapFree()[flags.target]
  fetchTargetData(ns, target)
  prepTarget(ns, target, serversWithRam)

  const builder = new HackBuilder(target)
  builder.calcTasks()
  for (let i = 0; i < 500; ++i) {
    hackTarget(ns, target, builder, serversWithRam)
    builder.clearServerAssignments()
  }
  prepTarget(ns, target, serversWithRam, true)
}

/**
 * @param {NS} ns
 * @param {number} minRam - the smallest amount of ram we might use at once
 **/
function fetchServersWithRam(ns, minRam) {
  return Object.values(networkMapFree()).filter(server =>
    serverHasEnoughRam(ns, server, minRam) &&
    server.files.includes('batchWeaken.js')
  )
}

/**
 * @param {NS} ns
 * @param {Server} server
 * @param {number} minRam - the smallest amount of ram we might use at once
 * @returns {boolean} Whether the server's unused ram is enough to run one
 *                    thread of the smallest file
 **/
function serverHasEnoughRam(ns, server, minRam) {
  let reserved = server.hostname == 'home' ? reservedRam : 0
  server.availableRam = server.maxRam - ns.getServerUsedRam(server.hostname) - reserved
  return server.availableRam > minRam
}

/**
 * @param {NS} ns
 * @param {Server} target
 */
function fetchTargetData(ns, target) {
  target.hackDifficulty = ns.getServerSecurityLevel(target.hostname)
  target.moneyAvailable = ns.getServerMoneyAvailable(target.hostname)
  target.weakTime = weakTime(target)
  target.hackTime = hackTime(target)
  target.growTime = growTime(target)
}


/**
 * @param {NS} ns
 * @param {Server} target
 * @param {Server[]} serversWithRam
 * @param {boolean} corrective
 */
function prepTarget(ns, target, serversWithRam, corrective = false) {
  const batchDataQueue = fetchBatchQueue()
  if (!corrective && isHealthy(ns, target) && batchDataQueue.hasPreppingBatch(target.hostname)) {
    ns.print("No prep needed, continuing with hacking...")
    return
  }
  if ( corrective ) {
    target.hackDifficulty = target.hackDifficulty * 1.5
    target.moneyAvailable = target.moneyAvailable * 0.5
  }

  const builder = new PrepBuilder(target)
  builder.calcTasks()
  builder.assignServers(serversWithRam)
  if (builder.isEmpty()) {
    ns.print("Found zero ram to fulfill prepping, try again later....")
    ns.exit()
  }
  ns.print(`Ready for launch!`)
  launch(ns,builder)
}

/**
 * @param {NS} ns
 * @param {Server} server
 * @returns {boolean} Whether the server is grown to max and weakened enough
 **/
function isHealthy(ns, server) {
  return ns.getServerMoneyAvailable(server.hostname) >= (server.moneyMax*0.99) && server.hackDifficulty < (server.minDifficulty*1.005)
}


/**
 * @param {NS} ns
 * @param {Server} target
 * @param {Builder} builder
 * @param {Server[]} serversWithRam
 */
function hackTarget(ns, target, builder, serversWithRam) {
  builder.assignServers(serversWithRam)

  if (builder.isEmpty() || !builder.isFulfilled() ) {
    ns.print("Not enough ram to fulfill hacking batch, try again later....")
    ns.exit()
  }

  ns.print(`Ready for launch! Target: ${target.hostname}`)
  launch(ns,builder,target.hostname)
}



const fileNames = {
  'hack' : 'batchHack.js',
  'weak' : 'batchWeaken.js',
  'grow' : 'batchGrow.js',
}

/**
 * @param {NS} ns
 * @param {PrepBuilder|HackBuilder} batcher
 * Launches the batch  
 */
function launch(ns, batcher) {
  const target = batcher.target.hostname
  const batchID = fetchNextBatchID()
  const longestTime = Math.max(...batcher.tasks.map(t => t.time))
  ns.print(`batch id: ${batchID}`)

  const errorWindowStartTime = Date.now() + longestTime
  for (const job of batcher.tasks) {
    ns.print(job)
    const delay = longestTime - job.time
    const args = JSON.stringify({id: batchID, delay: delay, target: target})
    if (job.threads == 0) continue
    job.pids = []
    for (const server of job.servers) {
      const pid = ns.exec(fileNames[job.type],server[0],{threads: server[1]}, args)
      job.pids.push(pid)
    }
  }

  if ( batcher.tasks.some(t => t.pids.some(p => p == 0)) && batcher.type != 'Prepping') {
    ns.tprint(`ERROR: One or more pids was zero! Canceling other jobs in batch ${batchID}.`)
    for (let job of batcher.tasks) {
      job.pids.forEach(pid => pid == 0 ? null : ns.kill(pid))
    }
    return
  }

  const errorWindowEndTime = Date.now() + longestTime
  ns.print(`recordBatch(start, end, id, longestTime, type, target)`)
  ns.print(`recordBatch(${errorWindowStartTime}, ${errorWindowEndTime}, ${batchID}, ${longestTime}, ${batcher.type}, ${target})`)
  recordBatch(errorWindowStartTime,
              errorWindowEndTime,
              batchID,
              longestTime,
              batcher.type,
              target)
}

/**
 * @returns {num} Next batch ID number, probably unique
 */
function fetchNextBatchID() {
  let lastID = parseInt( (getLSItem('batchJobId') ?? 0), 36 )
  let nextID = lastID + 1
  if ( nextID > 9_999_999_999_999 ) { nextID = 1 }
  setLSItem('batchJobId', nextID.toString(36))
  return nextID.toString(36)
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
