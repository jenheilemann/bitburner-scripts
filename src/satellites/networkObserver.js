import { setLSItem } from 'helpers.js'
import { networkMap } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let nMap = await networkMap(ns)

  setLSItem('NMAP', nMap)
}
