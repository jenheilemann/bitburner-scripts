/** @param {NS} ns */
export async function main(ns) {
    let ret = ns.upgradeHomeRam()
    if (ret) return announce(ns, 'Upgraded home ram automatically', 'success')
    announce(ns, 'Failed to upgrade home ram', 'failure')
}
