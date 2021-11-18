import { findPath } from 'network.js'
import { factionServers } from 'constants.js'

/** @param {NS} ns **/
export async function main(ns) {
  let target = ns.args[0]
  await goHome(ns, target)
}

/**
 * @param {NS} ns
 * @param {string} target
 **/
export async function goHome(ns, target) {
  let path = await findPath(target)
  path.reverse().forEach(step => ns.connect(step))
}
