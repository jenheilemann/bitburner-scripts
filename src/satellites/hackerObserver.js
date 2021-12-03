import {
  disableLogs,
  getNsDataThroughFile as fetch,
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
const reservedRam = 30
const bufferTime = 50 //ms
const hackDecimal = 0.6
const weakenAnlz = 0.05

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['exec', 'sleep'])
  let nmap, player, searcher, targets, result

  while(true) {
    nmap = await networkMap(ns)
    player = fetchPlayer()
    searcher = new BestHack(nmap)
    targets = searcher.findTopN(ns, player, 3)
    if ( !targets.some(s => s.name === 'joesguns') ) {
      targets.splice(1, 0, {name: 'joesguns'})
      targets.pop()
    }

    for (let server of targets) {
      try {
        ns.print(`Targeting ${server.name} ......................`)
        await targetServer(ns, server.name, nmap)
      }
      catch {
        break
      }
    }
    await ns.sleep(1000)
  }
}

/**
 * @param {NS} ns
 * @param {string} name - server name to attempt to target
 **/
async function targetServer(ns, name, nmap) {
  const target = await fetchServer(ns, name)
  if ( await preGrow(ns, target, nmap) || await preWeaken(ns, target, nmap ) ) {
    ns.print(`INFO: Pre-growing/-weakening ${target.name}`)
    return
  }
  ns.print(`SUCCESS: **** No need to weaken or grow ${target.name}`)
  ns.print(`${formatNumber(target.security)} security`)
  ns.print(`${formatMoney(target.data.moneyAvailable)}`)


  let [hackThreads, hackTime, hackedMoney] = await hackInfo(ns, target)
  if (hackThreads == -1) return
  let [growThreads, growTime] = await growthInfo(ns, target, hackedMoney )
  let [weakThreads, weakTime] = await weakenInfo(ns, target)
  await findThreadsAndRun(ns, nmap, 'weaken.js', weakThreads, target.name, 0, Date.now())
  await findThreadsAndRun(ns, nmap, 'grow.js',   growThreads, target.name, (weakTime - growTime), Date.now())
  await findThreadsAndRun(ns, nmap, 'hack.js',   hackThreads, target.name, (weakTime - hackTime), Date.now())
}


/**
 * @param {NS} ns
 * @param {object} target - server info object
 * @returns {boolean} - whether the server is being weakened before running scripts
 **/
async function preWeaken(ns, target, nmap) {
  const weakenAmt = target.security - target.minSecurity
  if (weakenAmt <= 2 ) {
    ns.print(`${target.name} security low enough (${target.security}/${target.minSecurity})`)
    return false
  }

  let weakenThreads = Math.ceil(weakenAmt/weakenAnlz)
  ns.print(`**** Need to weaken ${target.name} by ${weakenAmt} (${target.security}/${target.minSecurity}), need ${weakenThreads} threads`)
  await findThreadsAndRun(ns, nmap, 'weaken.js', weakenThreads, target.name)
  return true
}


/**
 * @param {NS} ns
 * @param {object} target - server info object
 * @returns {boolean} - whether the server is being grown before running scripts
 **/
async function preGrow(ns, target, nmap) {
  if ( target.data.moneyAvailable > target.maxMoney * 0.1 ) {
    ns.print(`${target.name} money is enough. (${formatMoney(target.data.moneyAvailable)}/${formatMoney(target.maxMoney)})`)
    return false
  }

  let multiplier = target.maxMoney/(Math.max(1.1, target.data.moneyAvailable))
  let threads = Math.ceil(await fetch(ns, `ns.growthAnalyze('${target.name}',${multiplier})`))
  let security = await fetch(ns,`ns.growthAnalyzeSecurity(${threads})`)
  ns.print(`**** Need to grow ${target.name} by ${formatNumber(multiplier * 100)}%, ${threads} threads`)
  await findThreadsAndRun(ns, nmap, 'grow.js', threads, target.name)
  target.security = target.security + security
  return true
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
  let availableRam, availableThreads, threadsToRun, server

  for ( const sn in nmap ) {
    server = nmap[sn]
    if ( server.maxRam - server.data.ramUsed < ramSizes[file] ||
      (sn == 'home' && (server.maxRam - server.data.ramUsed - reservedRam) < ramSizes[file]) ) {
      continue
    }
    availableRam = server.maxRam - server.data.ramUsed
    availableThreads = Math.floor(availableRam/ramSizes[file])
    threadsToRun = Math.min(availableThreads, numThreads)
    numThreads -= threadsToRun
    ns.print(`ns.exec('${file}', '${sn}', ${threadsToRun}, ${formatDuration(wait)}, '${target}', ${rand})`)
    ns.exec(file, sn, threadsToRun, wait, target, rand)
    nmap[sn].data.ramUsed = nmap[sn].data.ramUsed + ramSizes[file]*threadsToRun
    if (numThreads <= 0)
      return
  }
  ns.print(`INFO: Not enough threads available to completely ${file} target ${target}, numThreads needed: ${numThreads}`)
  throw('not enough threads')
}

/**
 * @param {NS} ns
 * @param {object} target
 **/
async function hackInfo(ns, target) {
  const player = fetchPlayer()
  let time = ns.formulas.hacking.hackTime(target.data, player) + bufferTime*2
  let amountToHack = target.data.moneyAvailable * hackDecimal
  let threads = Math.floor(await fetch(ns, `ns.hackAnalyzeThreads('${target.name}', ${amountToHack})`))
  if ( threads == -1 ) {
    announce(ns, `hackAnalyzeThreads returned -1 for server ${target.name}`, 'error')
    return [-1, 0, 0]
  }
  let security = await fetch(ns, `ns.hackAnalyzeSecurity(${threads})`)
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
  let threads = Math.ceil(await fetch(ns, `ns.growthAnalyze('${target.name}',${multiplier})`))
  let security = await fetch(ns,`ns.growthAnalyzeSecurity(${threads})`)
  target.security += security
  ns.print(`Grow time: ${formatDuration(time)} multiplier: ${multiplier} security: ${security}`)
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
