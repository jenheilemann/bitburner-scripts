import { lsKeys } from 'constants.js'
import { getLSItem } from 'helpers.js'

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
    ['pretty', false],
    ['p', false],
  ])

  if ( !args.key && !args.k ) {
    ns.tprint(`This script needs a recognized key!`)
    ns.tprint('like: `run lsSet.js --key reserve`')
    return
  }

  let key = args.k ? args.k : args.key
  if ( !lsKeys[key.toUpperCase()] ) {
    ns.tprint(`That is not a recognized key. Use one of: `)
    ns.tprint(Object.keys(lsKeys).join(", "))
    return
  }

  if ( args.p || args.pretty ) {
    ns.tprint(`\n\r${JSON.stringify(getLSItem(key), null, 2)}`)
  } else {
    ns.tprint(getLSItem(key))
  }
}

