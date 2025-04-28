import { networkMapFree } from 'utils/network.js'
import { getLSItem, setLSItem } from 'utils/helpers.js'
import { getPercentUsedRam, calcHackAmount } from '/batching/calculations.js'

/** @param {NS} ns */
export async function main(ns) {
  let nmap = networkMapFree()
  let utilizedRam = getPercentUsedRam(nmap)
  ns.ui.openTail(), ns.clearLog()
  ns.print(`calcHackAmount of b-and-a: ${calcHackAmount(nmap['b-and-a'])}`)

  ns.print(`Utilized Ram: ${ns.formatPercent(utilizedRam)} (${utilizedRam})`)
  let adjustment = calcHackPercentAdjustment(utilizedRam)
  ns.print(`Proposed hack percent adjustment: ${adjustment}`)
  setLSItem('hackPercent', adjustment)
  ns.print(`calcHackAmount of b-and-a: ${calcHackAmount(nmap['b-and-a'])}`)
}

function calcHackPercentAdjustment(ramPercent) {
  return capPercenAdjustment(percentAdjustBasedOnRam(ramPercent) * getLSItem('HackPercent'))
}

function percentAdjustBasedOnRam(ramPercent) {
  if (ramPercent < 0.1)
    return 2
  if (ramPercent < 0.5)
    return 1.05
  if (ramPercent < 0.95)
    return 1.01
  if (ramPercent > 0.99)
    return 0.99
  return 1
}

function capPercenAdjustment(val) {
  return Math.min(99, val)
}
