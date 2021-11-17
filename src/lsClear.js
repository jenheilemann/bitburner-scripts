import { lsKeys } from 'constants.js'
import { clearLSItem,getLSItem } from 'helpers.js'

export function autocomplete() {
  return Object.keys(lsKeys)
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let key = ns.args[0]

  if ( !key ) {
    ns.tprint(`This script needs a recognized key!`)
    ns.tprint('like: `run lsClear.js player`')
    return
  }

  let safeKey = lsKeys[key.toUpperCase()]
  if ( !safeKey ) {
    ns.tprint(`That is not a recognized key. Use one of: `)
    ns.tprint(Object.keys(lsKeys).join(", "))
    return
  }

  clearLSItem(safeKey)
  ns.tprint(`Cleared '${safeKey}' ${getLSItem(safeKey)}`)
}

