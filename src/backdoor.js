import { findPath } from 'network.js'
import { factionServers } from 'constants.js'
import { announce } from 'helpers.js'

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
  let path = await findPath(target)

  path.forEach((step) => ns.connect(step))
  await ns.installBackdoor()
  announce(ns, `Backdoor installed on ${target}`)
  ns.connect('home')
}
