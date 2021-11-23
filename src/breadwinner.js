
export function autocomplete(data, args) {
  return data.servers
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let target = await fetchServer(ns.args[0])
  let maxMoney = target.maxMoney
  let moneyThreshhold = maxMoney * 0.8
  let securityThreshhold = target.minSecurity + 3
  let money, threads, growFactor, player;
  let scriptThreads = parseInt(ns.args[1])

  while (true) {
    target = await fetchServer(ns.args[0])
    ns.print(`Security: ${ns.nFormat(target.security, "0,0.00")}`)
    if (target.security > securityThreshhold) {
      ns.print("------ Target security: " + securityThreshhold)
      await ns.weaken(target.name)
      continue
    }

    target = await fetchServer(ns.args[0])
    money = target.data.moneyAvailable
    ns.print("Current money: " + ns.nFormat(money, "$0.00a") )

    if (money < moneyThreshhold) {
      ns.print("------  Target money: " + ns.nFormat(moneyThreshhold, "$0.00a"))
      growFactor = maxMoney / money
      player = fetchPlayer()
      threads = Math.ceil(numCycleForGrowth(target.data, growFactor, player))
      threads = Math.min(threads, scriptThreads)
      await ns.grow(target.name, { threads: threads });
      continue
    }

    if (money <= 0) {
      ns.print("Not enough money to hack, continuing", target.name, money)
      await mySleep(200)
      continue
    }

    target = await fetchServer(ns.args[0])
    threads = Math.floor(hackThreads(target.data, money * 0.6))
    threads = Math.min(threads, scriptThreads)
    if (threads == -1) {
      ns.tprint("Threads negative!")
      await mySleep(50)
      continue
    }

    await ns.hack(target.name, { threads: threads })
    await mySleep(75)
  }
}

function hackThreads(server, hackAmount) {
  if (hackAmount < 0 || hackAmount > server.moneyAvailable) {
    return -1;
  }

  const player = fetchPlayer()
  const percentHacked = calculatePercentMoneyHacked(server, player)
  return hackAmount / Math.floor(server.moneyAvailable * percentHacked)
}

/**
 * Returns the percentage of money that will be stolen from a server if
 * it is successfully hacked (returns the decimal form, not the actual percent value)
 */
export function calculatePercentMoneyHacked(server, player) {
  // Adjust if needed for balancing. This is the divisor for the final calculation
  const balanceFactor = 240;

  const difficultyMult = (100 - server.hackDifficulty) / 100;
  const skillMult = (player.hacking - (server.requiredHackingSkill - 1)) / player.hacking;
  const percentMoneyHacked = (difficultyMult * skillMult * player.hacking_money_mult) / balanceFactor;
  if (percentMoneyHacked < 0) {
    return 0;
  }
  if (percentMoneyHacked > 1) {
    return 1;
  }

  return percentMoneyHacked * 0.2 // BN4 ScriptHackMoney multiplier
}

/**
 * Returns the number of "growth cycles" needed to grow the specified server by
 * the specified amount.
 * @param server - Server being grown
 * @param growth - How much the server is being grown by, in DECIMAL form (e.g. 1.5 rather than 50)
 * @param p - Reference to Player object
 * @returns Number of "growth cycles" needed
 */
export function numCycleForGrowth(server, growth, p, cores = 1) {
  let ajdGrowthRate = 1 + (1.03 - 1) / server.hackDifficulty
  if (ajdGrowthRate > 1.0035) {
    ajdGrowthRate = 1.0035;
  }

  const serverGrowthPercentage = server.serverGrowth / 100;

  const coreBonus = 1  / 16;
  const cycles =
    Math.log(growth) /
    (Math.log(ajdGrowthRate) *
      p.hacking_grow_mult *
      serverGrowthPercentage *
      coreBonus)

  return cycles
}

export const lsKeys = {
  NMAP : 'jh_network_map',
  PLAYER : 'jh_player',
}

/**
 * @param {NS} ns
 * @param {string} serverName
 **/
export async function fetchServer(serverName) {
  let map = await networkMap()
  return map[serverName]
}

export function fetchPlayer() {
  return getLSItem('player')
}

/**
 * @params {string} key
 * from helpers.js because copying all the files everywhere is not my jam
 **/
export function getLSItem(key) {
  let item = localStorage.getItem(lsKeys[key.toUpperCase()])

  return item ? JSON.parse(item) : undefined
}

/**
 * @param {NS} ns
 **/
export async function networkMap() {
  let map = getLSItem('NMAP')

  while ( map === undefined ) {
    await mySleep(200)
    map = getLSItem('NMAP')
  }

  return map;
}

/**
 * @param {integer} ms
 **/
export function mySleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}
