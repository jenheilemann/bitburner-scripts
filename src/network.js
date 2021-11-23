import { getLSItem, mySleep } from 'helpers.js'

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

  while ( map === undefined ) {
    ns.print(`map is undefined, running networkMapper.js`)
    ns.run('networkMapper.js', 1)
    await mySleep(200)
    map = getLSItem('NMAP')
  }
  return map
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
 * @param {string} serverName
 **/
export async function fetchServerFree(serverName) {
  let map = await networkMapFree()
  return map[serverName]
}

/**
 * @param {NS} ns
 **/
export async function networkMapFree() {
  let map = getLSItem('NMAP')

  while ( map === undefined ) {
    await mySleep(50)
    map = getLSItem('NMAP')
  }

  return map;
}

/**
 * @param {NS} ns
 * @param {string} goal
 **/
export async function findPath(goal) {
  let nMap = await networkMapFree()

  let path = []
  while (true) {
    path.unshift(goal)
    goal = nMap[goal].parent
    if (goal == '') {
      return path
    }
  }
}

