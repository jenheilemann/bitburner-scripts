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
    ['pretty', false],
    ['p', false],
  ])

  if ( args._.length === 0 ) {
    ns.tprint(`This script needs a recognized key!`)
    ns.tprint('like: `run lsGet.js reserve`')
    return
  }

  let key = args._[0]
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

