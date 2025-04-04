import { getLSItem, setLSItem } from 'helpers.js'
import { mapNetwork } from 'networkMapper.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let map = networkMap(ns)
  setLSItem('nmap', map)
}

/**
 * @param {NS} ns
 * @cost 2.4 GB
 **/
export function networkMap(ns) {
  return mapNetwork(ns)
}

/**
 * @param {NS} ns
 * @param {string} serverName
 * @cost 2.4 GB
 **/
export function fetchServer(ns, serverName) {
  let map = networkMap(ns)
  return map[serverName]
}

/**
 * @param {string} serverName
 * @cost 0 GB
 **/
export function fetchServerFree(serverName) {
  let map = networkMapFree()

  if (!map) {
    return false
  }

  return map[serverName]
}

/**
 * @param {NS} ns
 * @cost 0 GB
 **/
export function networkMapFree() {
  let map = getLSItem('nmap')

  if ( !map ) {
    return false
  }

  return map;
}

/**
 * @param {NS} ns
 * @param {string} goal
 **/
export function findPath(goal) {
  let nMap = networkMapFree()

  let path = []
  // @ignore-infinite
  while (true) {
    path.unshift(goal)
    goal = nMap[goal].parent
    if (goal == '') {
      return path
    }
  }
}

