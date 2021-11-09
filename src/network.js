import { getLSItem } from 'helpers.js'

export async function networkMap(ns) {
  let map = getLSItem(lsKeys['nmap'])

  while ( map === undefined ) {
    ns.run('networkMapper.js', 1)
    await ns.sleep(200)
    map = getLSItem(lsKeys['nmap'])
  }

  return map;
}
