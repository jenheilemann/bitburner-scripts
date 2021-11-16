import { setLSItem } from 'helpers.js'
import { networkMap } from 'network.js'
import { updateData } from 'networkMapper.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let nMap = await networkMap(ns)

  for ( let server in nMap ) {
    updateData(ns, nMap[server])
  }

  setLSItem('NMAP', nMap)
}
