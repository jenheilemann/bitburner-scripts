import { disableLogs, setLSItem } from 'utils/helpers.js'
import { networkMap } from 'utils/network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let map = networkMap(ns)
  setLSItem('nmap', map)
}
