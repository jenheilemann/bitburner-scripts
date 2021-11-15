import { findPath } from 'network.js'

/** @param {NS} ns **/
export async function main(ns) {
  let target = ns.args[0]
  await backdoor(ns, target)
}

/**
 * @param {NS} ns
 * @param {string} target
 **/
export async function backdoor(ns, target) {
  let path = await findPath(ns, target)

  path.forEach((step) => ns.connect(step))
  await ns.installBackdoor()
  path.reverse().forEach(step => ns.connect(step))
}
