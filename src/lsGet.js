import { lsKeys } from 'constants.js'
import { getLSItem, formatMoney, formatNumberShort } from 'helpers.js'

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

  if ( args._.length === 0 ) {
    ns.tprint(`This script needs a recognized key!`)
    ns.tprint('like: `run lsGet.js reserve`')
    return
  }

  let keys = args._.slice()
  let key = keys.shift()
  if ( !lsKeys[key.toUpperCase()] ) {
    ns.tprint(`That is not a recognized key. Use one of: `)
    ns.tprint(Object.keys(lsKeys).join(", "))
    return
  }

  let value = getLSItem(key), nextKey
  while ( keys.length > 0 ) {
    key = keys.shift()
    value = value[key]
  }

  if (key == 'reserve') value = formatMoney(value)
  if (key.toLowerCase().includes('money') ) value = formatMoney(value)
  if (typeof value == 'number') value = formatNumberShort(value, 6, 3)

  if ( args.p || args.pretty ) {
    ns.tprint(`\n\r${JSON.stringify(value, null, 2)}`)
  } else {
    ns.tprint(value)
  }
}

