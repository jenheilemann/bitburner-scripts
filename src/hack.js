/**
 * @param {NS} ns
 */
export async function main(ns) {
  await ns.hack(ns.args[1], {additionalMsec: ns.args[0]})
}
