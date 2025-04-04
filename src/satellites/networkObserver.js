import { mapNetwork } from 'networkMapper.js'
import { setLSItem } from 'helpers.js'


/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let map = mapNetwork(ns)
  setLSItem('nmap', map)
}
