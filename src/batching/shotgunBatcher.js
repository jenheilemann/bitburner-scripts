import { disableLogs,
         getLSItem, setLSItem,
       } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { reservedRam } from 'utils/constants.js'
import { BatchDataQueue } from '/batching/queue.js'
import { PrepBuilder, HackBuilder } from '/batching/shotgunBuilder.js'
import { weakTime, growTime, hackTime,
         ramSizes,
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
  const queue = fetchBatchQueue()
  prepTarget(ns, target, serversWithRam, queue)

  const builder = new HackBuilder(target)
  builder.calcTasks()
  for (let i = 0; i < 500; ++i) {
    hackTarget(ns, target, builder, serversWithRam, queue)
    builder.clearServerAssignments()
  }
  saveBatches(queue)
}

/**
 * @param {NS} ns
 * @param {number} minRam - the smallest amount of ram we might use at once
 **/
export function fetchServersWithRam(ns, minRam) {
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
 * @param {BatchDataQueue} queue
 */
function prepTarget(ns, target, serversWithRam, queue) {
  if (isHealthy(ns, target) && queue.hasPreppingBatch(target.hostname)) {
    ns.print("No prep needed, continuing with hacking...")
    return
  }

  const builder = new PrepBuilder(target)
  builder.calcTasks()
  builder.assignServers(serversWithRam)
  if (builder.isEmpty()) {
    ns.print("Found zero ram to fulfill prepping, try again later....")
    saveBatches(queue)
    ns.exit()
  }
  ns.print(`Launching prepping batch!`)
  launch(ns,builder,queue)
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
 * @param {BatchDataQueue} queue
 */
function hackTarget(ns, target, builder, serversWithRam, queue) {
  builder.assignServers(serversWithRam)

  if (builder.isEmpty() || !builder.isFulfilled() ) {
    ns.print("Not enough ram to fulfill hacking batch, try again later....")
    saveBatches(queue)
    ns.exit()
  }

  ns.print(`Launching hacking batch, Target: ${target.hostname}`)
  launch(ns,builder, queue)
}

const fileNames = {
  'hack' : 'batchHack.js',
  'weak' : 'batchWeaken.js',
  'grow' : 'batchGrow.js',
}

/**
 * @param {NS} ns
 * @param {PrepBuilder|HackBuilder} batcher
 * @param {BatchDataQueue} queue
 * Launches the batch
 */
function launch(ns, batcher, queue) {
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
      server.push(pid)
    }
  }

  if ( batcher.tasks.some(t => t.pids.some(p => p == 0)) && batcher.type != 'Prepping') {
    ns.tprint(`ERROR: One or more pids was zero! Canceling other jobs in batch ${batchID}.`)
    for (let job of batcher.tasks) {
      job.pids.forEach(pid => pid == 0 ? null : ns.kill(pid))
    }
    saveBatches(queue)
    ns.exit();
  }

  const errorWindowEndTime = Date.now() + longestTime
  const pidsWithThreads = []
  batcher.tasks.forEach((j) => { pidsWithThreads.push([j.type, ...j.servers]) })
  ns.print(`recordBatch(start, end, id, longestTime, type, target, pids)`)
  ns.print(`recordBatch(${errorWindowStartTime}, ${errorWindowEndTime}, ${batchID}, ${longestTime}, ${batcher.type}, ${target}, ${pidsWithThreads})})`)
  queue.addNewJob(errorWindowStartTime,
              errorWindowEndTime,
              batchID,
              longestTime,
              batcher.type,
              target,
              pidsWithThreads)
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
 * @param {BatchDataQueue} queue
 * @returns {null}
 */
function saveBatches(queue) {
  setLSItem('batches', queue.toObj())
}
