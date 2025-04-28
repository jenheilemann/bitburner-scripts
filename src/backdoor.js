import { findPath } from 'utils/network.js'
import { announce } from 'utils/helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  let target = ns.args[0]
  ns.tprint(`Backdoor running on ${target}`)
  await backdoor(ns, target)
}

export function autocomplete(data, args) {
  return data.servers
}

/**
 * @param {NS} ns
 * @param {string} target
 **/
export async function backdoor(ns, target) {
  let path = findPath(target)

  path.forEach((step) => ns.singularity.connect(step))
  await ns.singularity.installBackdoor()
  announce(ns, `Backdoor installed on ${target}`)
  ns.singularity.connect('home')
  if ( target == 'w0r1d_d43m0n'){
    ns.killall('home')
    ns.tprint('SUCCESS: The w0r1d_d43m0n has been defeated. Time to move on.')
  }
}
