/**
 * breadwinner.js
 *
 * Built to be run independantly, this is the teenager version of the starter script.
 * Very cheap ram-wise because it calculates many things manually.
 * Works best if each instance of breadwinner.js is targeting a different server,
 * to reduce collisions.
 *
 * Called with `run breadwinner.js -t 17 n00dles 17`
 *
 * Threads are passed as the second argument to avoid ns.getRunningScript() & similar.
 **/


export function autocomplete(data, args) {
  return data.servers
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog('disableLog')
  ns.disableLog('sleep')

  let target = await fetchServer(ns.args[0])
  let maxMoney = target.maxMoney
  let moneyThreshhold = maxMoney
  let securityThreshhold = target.minSecurity + 3
  let money, threads, growFactor, player;
  let scriptThreads = parseInt(ns.args[1])

  while (true) {
    await ns.sleep(53)
    target = await fetchServer(ns.args[0])
    ns.print(`Security: ${ns.formatNumber(target.security, 2)}`)
    if (target.security > securityThreshhold) {
      ns.print("------ Target security: " + securityThreshhold)
      await ns.weaken(target.name)
      continue
    }

    target = await fetchServer(ns.args[0])
    money = target.moneyAvailable
    ns.print("Current money: $" + ns.formatNumber(money, 2) )

    if (money < moneyThreshhold) {
      ns.print("------  Target money: " + ns.formatNumber(moneyThreshhold, 2))
      threads = numCycleForGrowth(target, maxMoney, ns)
      ns.print(`Calculating ${threads} to grow \$${(moneyThreshhold-money)} from ${target.name} (vs ${scriptThreads})`)
      threads = Math.min(threads, scriptThreads)
      await ns.grow(target.name, { threads: threads });
      continue
    }

    if (money <= 0) {
      ns.print("Not enough money to hack, continuing", target.name, money)
      continue
    }

    target = await fetchServer(ns.args[0])
    let desiredHackAmount = money * 0.05
    threads = hackThreads(target, desiredHackAmount)
    ns.print(`Calculating ${threads} to hack \$${desiredHackAmount} from ${target.name} (vs ${scriptThreads})`)
    threads = Math.min(threads, scriptThreads)
    if (threads == -1) {
      ns.tprint("Threads negative!")
      continue
    }

    await ns.hack(target.name, { threads: threads })
  }
}

function hackThreads(server, hackAmount) {
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
export function calculatePercentMoneyHacked(server) {
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

/**
 * Returns the number of "growth cycles" needed to grow the specified server by
 * the specified amount.
 * @param server - Server being grown
 * @param targetMoney - - How much you want the server grown TO (not by), for instance, to grow from 200 to 600, input 600
 * @returns Number of "growth cycles" needed
 */
export function numCycleForGrowth(server, targetMoney) {
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
export function calculateServerGrowthLog(server, threads, p, cores = 1) {
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

export const lsKeys = {
  NMAP : 'jh_network_map',
  PLAYER : 'jh_player',
  BITNODE : 'jh_bn_multipliers',
}

/**
 * @param {NS} ns
 * @param {string} serverName
 **/
async function fetchServer(serverName) {
  let map = await networkMap()
  return map[serverName]
}

function fetchPlayer() {
  return getLSItem('player')
}

/**
 * @params {string} key
 * from helpers.js because copying all the files everywhere is not my jam
 **/
function getLSItem(key) {
  let item = localStorage.getItem(lsKeys[key.toUpperCase()])

  return item ? JSON.parse(item) : undefined
}

/**
 * @param {NS} ns
 **/
async function networkMap() {
  let map = getLSItem('NMAP')

  while ( map === undefined ) {
    await mySleep(5)
    map = getLSItem('NMAP')
  }

  return map;
}

/**
 * @param {integer} ms
 **/
function mySleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}
