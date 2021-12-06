import {
  disableLogs,
  announce,
  fetchPlayer,
  formatDuration, formatNumber, formatMoney,
} from 'helpers.js'
import { networkMap, fetchServer } from 'network.js'
import { BestHack } from 'bestHack.js'

const ramSizes = {
  'hack.js'   : 1.7,
  'weaken.js' : 1.75,
  'grow.js'   : 1.75,
}
const reservedRam = 100
const bufferTime = 20 //ms
const hackDecimal = 0.05
const weakenAnlz = 0.05
const serverFortifyAmount = 0.002

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['exec', 'sleep'])
  let nmap, player, searcher, targets

  while(true) {
    nmap = await networkMap(ns)
    player = fetchPlayer()
    searcher = new BestHack(nmap)
    targets = searcher.findTop(ns, player)
    if ( targets.some(s => s.name === 'joesguns') && targets[0].name != 'joesguns' ) {
      targets = targets.filter(s => s.name != 'joesguns')
      targets.splice(1, 0, await fetchServer(ns, 'joesguns'))
    }
    // ns.toast(`Targets: (${targets.length}) ${targets.map(t => t.name).join(', ')}`)

    for (let server of targets) {
      try {
        ns.print(`INFO: Targeting ${server.name} ......................`)
        await targetServer(ns, server, nmap)
      }
      catch(err) {
        ns.print(`ERROR: ${err}`)
        break
      }
    }
    await ns.sleep(1000)
  }
}

/**
 * @param {NS} ns
 * @param {object} target - server name to attempt to target
 * @param {object} nmap - network map of all servers
 **/
async function targetServer(ns, target, nmap) {
  ns.print(`Security: ${formatNumber(target.security)}/${formatNumber(target.minSecurity)} ----- ` +
    `Money: ${formatMoney(target.data.moneyAvailable)}/${formatMoney(target.maxMoney)}`)
  let [hackThreads, hackTime, hackedMoney] = await hackInfo(ns, target)
  if (hackThreads == -1) return
  let [growThreads, growTime] = await growthInfo(ns, target, hackedMoney )
  let [weakThreads, weakTime] = await weakenInfo(ns, target)

  /**
   * The order below is important. If one `findThreadsAndRun` fails because of
   * a lack of available ram, the following will be skipped, and all subsequent
   * servers as well. If they are in a different order, then a hack or a grow
   * could happen without an accompanying weak. Or a hack could happen without
   * a grow.
   * Is it possible to sum all the available ram before this? absolutely. Is
   * that how I coded this? nope.
   **/
  await findThreadsAndRun(ns, nmap, 'weaken.js', weakThreads, target.name, 0, Date.now())
  await findThreadsAndRun(ns, nmap, 'grow.js',   growThreads, target.name, (weakTime - growTime), Date.now())
  if (hackThreads > 0 ) await findThreadsAndRun(ns, nmap, 'hack.js',   hackThreads, target.name, (weakTime - hackTime), Date.now())
}

/**
 * @param {NS} ns
 * @param {object} nmap - network map of servers
 * @param {string} file
 * @param {integer} numThreads
 * @param {string} target
 * @param {integer} wait (default: 0)
 * @param {integer} rand - random input, allow a server to have multiple duplicate running simultaneously
 **/
async function findThreadsAndRun(ns, nmap, file, numThreads, target, wait = 0, rand = 0) {
  let availableRam, availableThreads, threadsToRun, server, reserved

  for ( const sn in nmap ) {
    server = ns.getServer(sn)
    reserved = server.hostname == 'home' ? reservedRam : 0
    if ( server.maxRam - server.ramUsed < ramSizes[file] + reserved ||
      !nmap[sn].files.includes(file) ) {
      continue
    }
    availableRam = server.maxRam - server.ramUsed - reserved
    availableThreads = Math.floor(availableRam/ramSizes[file])
    threadsToRun = Math.min(availableThreads, numThreads)
    numThreads -= threadsToRun
    ns.print(`ns.exec('${file}', '${sn}', ${threadsToRun}, ${formatDuration(wait)}, '${target}', ${rand})`)
    ns.exec(file, sn, threadsToRun, wait, target, rand)
    // nmap[sn].data.ramUsed = nmap[sn].data.ramUsed + ramSizes[file]*threadsToRun
    if (numThreads <= 0) {
      return
    }
  }
  ns.print(`INFO: Not enough ram to finish ${file} target ${target}, numThreads needed: ${numThreads}`)
  throw('not enough threads')
}

/**
 * @param {NS} ns
 * @param {object} target
 **/
async function hackInfo(ns, target) {
  if ( target.data.moneyAvailable/target.maxMoney < 0.1) return [0,0,0]

  const player = fetchPlayer()
  const time = ns.formulas.hacking.hackTime(target.data, player) + bufferTime*2
  const amountToHack = target.data.moneyAvailable * hackDecimal
  const threads = Math.floor(hackDecimal/ns.formulas.hacking.hackPercent(target.data, player))
  const security = serverFortifyAmount * threads
  target.security += security
  ns.print(`Hack time: ${formatDuration(time)} amountToHack: ${formatMoney(amountToHack)} `+
    `security: ${security} remaining: ${formatMoney(target.data.moneyAvailable - amountToHack)}`)
  return [threads, time, amountToHack]
}

/**
 * @param {NS} ns
 * @param {object} target
 * @param {number} amountHacked
 **/
async function growthInfo(ns, target, amountHacked) {
  const player = fetchPlayer()
  let time = ns.formulas.hacking.growTime(target.data, player) + bufferTime

  let multiplier = target.maxMoney/(Math.max(1.1, target.data.moneyAvailable - amountHacked))
  multiplier = Math.min(multiplier, 100)
  let threads = Math.ceil((multiplier-1)/(ns.formulas.hacking.growPercent(target.data, 1, player)-1))
  let security = 2 * serverFortifyAmount * threads
  target.security += security
  ns.print(`Need to grow ${target.name} by ${formatNumber(multiplier * 100)}%, ${threads} threads, Grow time: ${formatDuration(time)}, security: ${security}`)
  return [threads, time]
}


/**
 * @param {NS} ns
 * @param {object} target
 * @global {integer} security - amount security will have increased this cycle
 **/
async function weakenInfo(ns, target) {
  const player = fetchPlayer()
  let time = ns.formulas.hacking.weakenTime(target.data, player)
  const security = target.security - target.minSecurity
  let threads = Math.ceil(security/weakenAnlz)
  ns.print(`Weak time: ${formatDuration(time)} sec to decrease: ${security}`)
  return [threads, time]
}
