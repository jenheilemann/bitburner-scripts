import { setLSItem } from 'helpers.js'
import { networkMap } from 'network.js'
import { updateData } from 'networkMapper.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let nMap = networkMap(ns)

  for ( let server of nMap ) {
    updateData(ns, server)
  }

  setLSItem('NMAP', nMap)
}
