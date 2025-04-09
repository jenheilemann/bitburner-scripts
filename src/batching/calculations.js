import { fetchPlayer, getLSItem } from 'helpers.js'

/** @param {NS} ns */
export async function main(ns) {
  ns.tprint('/batching/calculations.js Not meant to be run independently.')
}


/**
 * Returns time it takes to complete a hack on a server, in ms.
 * @param {Server} server - Server being grown
 * @returns {num} Time to hack, in ms
 */
export function hackTime(server) { 
  const player = fetchPlayer()
  if (typeof server.hackDifficulty !== "number" || 
    typeof server.requiredHackingSkill !== "number") 
    return Infinity;
  const difficultyMult = server.requiredHackingSkill * server.hackDifficulty;

  const baseDiff = 500;
  const baseSkill = 50;
  const diffFactor = 2.5;
  let skillFactor = diffFactor * difficultyMult + baseDiff;
  skillFactor /= player.skills.hacking + baseSkill;

  const speedMult = getLSItem('bitnode')['HackingSpeedMultiplier']
  const hackTimeMultiplier = 5;
  const hackingTime =
    (hackTimeMultiplier * skillFactor) /
    (player.mults.hacking_speed *
      speedMult *
      calculateIntelligenceBonus(player.skills.intelligence, 1));

  return hackingTime * 1000
}

// Game-set constants. Don't change these magic numbers.
const growTimeMultiplier = 3.2 // Relative to hacking time. 16/5 = 3.2
const weakenTimeMultiplier = 4 // Relative to hacking time

export function growTime(server) { 
  return hackTime(server) * growTimeMultiplier 
}
export function weakTime(server) { 
  return hackTime(server) * weakenTimeMultiplier 
}

export function calculateIntelligenceBonus(intelligence, weight = 1) {
  const bitNodeOptions = getLSItem('reset')['bitNodeOptions']
  const effectiveIntelligence =
    bitNodeOptions.intelligenceOverride !== undefined
      ? Math.min(bitNodeOptions.intelligenceOverride, intelligence)
      : intelligence;
  return 1 + (weight * Math.pow(effectiveIntelligence, 0.8)) / 600;
}


// minimum ram required to run each file with 1 thread
// avoid calling getScriptRam
export const ramSizes = {
  'hack' : 1.7,
  'weak' : 1.75,
  'grow' : 1.75,
}

/**
 * @param {string} type
 * @param {num} numThreads
 * @returns {num} Amount of ram needed to run that many of that type of action
 **/
export function calcRam(type, numThreads) {
  return ramSizes[type] * numThreads
}

/**
 * Returns the number of threads needed to grow the specified server by
 * the specified amount.
 * @param {Server} server - Server being grown
 * @param {num} targetMoney - - How much you want the server grown TO (not by),
 *                        for instance, to grow from 200 to 600, input 600
 * @returns {num} Number of threads needed
 */
export function calcThreadsToGrow(server, targetMoney) {
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
export function calcThreadsToHack(server, hackAmount) {
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

/**
 * Returns the percentage (as a decimal) that this server should be hacked
 * based on the amount of growth it has.
 * @param {Server} server
 */
export function calcHackAmount(server) {
  return Math.sqrt(Math.sqrt(server.serverGrowth))/50
}
