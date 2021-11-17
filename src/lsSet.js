import { lsKeys } from 'constants.js'
import { setLSItem } from 'helpers.js'

export function autocomplete() {
  return Object.keys(lsKeys)
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = ns.flags([
    ['k', ''],
    ['key', ''],
    ['v', ''],
    ['value', ''],
  ])

  if ( !args.key && !args.k ) {
    ns.tprint(`This script needs a recognized key!`)
    ns.tprint('like: `run lsSet.js --key reserve --v 2e6`')
    return
  }

  if ( !args.value && !args.v ) {
    ns.tprint(`This script needs a value!`)
    ns.tprint('like: `run lsSet.js --k reserve --value 2e6`')
    return
  }

  let key = args.k ? args.k : args.key
  let safeKey = lsKeys[key.toUpperCase()]
  if ( !safeKey ) {
    ns.tprint(`That is not a recognized key. Use one of: `)
    ns.tprint(Object.keys(lsKeys).join(", "))
    return
  }

  let value = args.v ? args.v : args.value
  setLSItem(safeKey, JSON.stringify(v))
  ns.tprint(`Set '${safeKey}': ${getLSItem(safeKey)}`)
}

