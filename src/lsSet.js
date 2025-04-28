import { lsKeys } from 'constants.js'
import { getLSItem, setLSItem } from 'utils/helpers.js'

export function autocomplete(data) {
  return Object.keys(lsKeys).concat(data.servers)
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = ns.flags([
    ['pretty', false],
    ['p', false],
  ])

  if ( args._.length !== 2 ) {
    ns.tprint(`This script needs a recognized key and value!`)
    ns.tprint('like: `run lsSet.js reserve 100`')
    return
  }

  let key = ns.args[0]
  let safeKey = lsKeys[key.toUpperCase()]
  if ( !safeKey ) {
    ns.tprint(`That is not a recognized key. Use one of: `)
    ns.tprint(Object.keys(lsKeys).join(", "))
    return
  }

  setLSItem(key, ns.args[1])
  ns.tprint(`Set '${safeKey}' to ${getLSItem(key)}`)
}

