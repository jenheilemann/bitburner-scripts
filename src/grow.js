/**
 * @param {NS} ns
 */
export async function main(ns) {
  await ns.sleep(ns.args[0])
  await ns.grow(ns.args[1])
}
