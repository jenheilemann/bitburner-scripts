import { getLSItem, lsKeys } from 'helpers.js'

export async function networkMap(ns) {
  let map = getLSItem(lsKeys['nmap'])
  ns.print(`fetched map from localStorage: (${typeof map}) ${map}`)

  while ( map === undefined ) {
    ns.print(`map is undefined, running networkMapper.js`)
    ns.run('networkMapper.js', 1)
    await ns.sleep(200)
    map = getLSItem(lsKeys['nmap'])
    ns.print(`fetched map from localStorage: (${typeof map}) ${map}`)
  }

  return map;
}

export async function main(ns) {
  await networkMap(ns)
}
