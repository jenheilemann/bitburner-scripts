/**
 * @param {NS} ns
 */
export async function main(ns) {
  await ns.weaken(ns.args[1], {additionalMsec: ns.args[0]})
}
