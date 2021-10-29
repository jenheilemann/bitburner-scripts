import { waitForCash } from "hacknet/helpers.js"
const maxRam = 64

async function upgradeRam(ns, node, id, ram) {
  if (node.ram >= ram) {
    return;
  }
  let cost = ns.hacknet.getRamUpgradeCost(id, 1)
  ns.print('Upgrading ram, costs ' + ns.nFormat(cost, "$0.000a"))
  await waitForCash(ns, cost);
  ns.hacknet.upgradeRam(id, 1)
}

async function upgradeTo(ns, totalCount) {
  let total, node, cost;
  while (true) {
    total = ns.hacknet.numNodes()
    for (let i = 0; i < total; i++) {
      node = ns.hacknet.getNodeStats(i)
      ns.print('Upgrading ' + node.name)
      await upgradeRam(ns, node, i, maxRam)
    }
    if (total >= totalCount && node.ram == maxRam) {
      ns.tprint("Hacknet Node Ram upgraded to max. I'm so cold.")
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
