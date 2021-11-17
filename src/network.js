import { getLSItem } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  await networkMap(ns)
}


/**
 * @param {NS} ns
 **/
export async function networkMap(ns) {
  let map = getLSItem('NMAP')
  ns.print(`fetched map from localStorage: (${typeof map}) ${map}`)

  while ( map === undefined ) {
    ns.print(`map is undefined, running networkMapper.js`)
    ns.run('networkMapper.js', 1)
    await ns.sleep(200)
    map = getLSItem('NMAP')
    ns.print(`fetched map from localStorage: (${typeof map}) ${map}`)
  }

  return map;
}

/**
 * @param {NS} ns
 * @param {string} serverName
 **/
export async function fetchServer(ns, serverName) {
  let map = await networkMap(ns)
  return map[serverName]
}

/**
 * @param {NS} ns
 * @param {string} goal
 **/
export async function findPath(ns, goal) {
  let nMap = await networkMap(ns)

  let path = []
  while (true) {
    path.unshift(goal)
    goal = nMap[goal].parent
    if (goal == '') {
      return path
    }
  }
}

