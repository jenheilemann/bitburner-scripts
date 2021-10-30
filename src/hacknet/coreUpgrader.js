import { waitForCash } from "helpers.js"
const maxCores = 8

async function upgradeCores(ns, node, id, cores) {
  if (node.cores >= cores) {
    return;
  }
  let cost = ns.hacknet.getCoreUpgradeCost(id, 1)
  ns.print('Upgrading core, costs ' + ns.nFormat(cost, "$0.000a"))
  await waitForCash(ns, cost)
  ns.hacknet.upgradeCore(id, 1)
}

async function upgradeTo(ns, totalCount) {
  let total, node, cost;
  while (true) {
    total = ns.hacknet.numNodes()
    for (let i = 0; i < total; i++) {
      node = ns.hacknet.getNodeStats(i)
      ns.print('Upgrading ' + node.name)
      await upgradeCores(ns, node, i, maxCores)
    }
    if (total >= totalCount && node.cores >= maxCores) {
      ns.tprint("Hacknet Node Cores upgraded to max. Hasta la vista, baby.")
      return;
    }
    await ns.sleep(200)
  }
}

export async function main(ns) {
  ns.disableLog("getServerMoneyAvailable")
  ns.disableLog("sleep")

  await upgradeTo(ns, ns.args[0])
}
