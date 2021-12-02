import { lsKeys } from 'constants.js'
import { setLSItem, getLSItem } from 'helpers.js'

export function autocomplete() {
  return Object.keys(lsKeys)
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {

  if ( ns.args.length == 0 ) {
    ns.tprint(`This script needs a recognized key!`)
    ns.tprint('like: `run lsSet.js reserve 2e6` or `run lsSet.js working`')
    return
  }

  let key = ns.args[0]
  let safeKey = lsKeys[key.toUpperCase()]
  if ( !safeKey ) {
    ns.tprint(`That is not a recognized key. Use one of: `)
    ns.tprint(Object.keys(lsKeys).join(", "))
    return
  }

  if ( key.toUpperCase() === 'WORKING' ){
    setLSItem(key, Date.now())
    ns.tprint(`Set '${safeKey}': ${getLSItem(key)}`)
    return
  }

  if ( ns.args.length < 2 ) {
    ns.tprint(`This script needs a value!`)
    ns.tprint('like: `run lsSet.js reserve 2e6`')
    return
  }

  let value = ns.args[1]
  setLSItem(key, value)
  ns.tprint(`Set '${safeKey}': ${getLSItem(key)}`)
}

