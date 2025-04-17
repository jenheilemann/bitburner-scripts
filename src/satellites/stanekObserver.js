/** @param {NS} ns */
export async function main(ns) {
  let rep = ns.singularity.getFactionRep("Church of the Machine God")
  while( ns.singularity.getFactionRep("Church of the Machine God") < rep + 100000) {
    await ns.stanek.chargeFragment(2,0)
    await ns.stanek.chargeFragment(1,2)
    await ns.stanek.chargeFragment(1,0)
  }
  ns.tprint("SUCCESS: CotMG has been fed.")
}
