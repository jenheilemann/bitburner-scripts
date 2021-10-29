import { waitForCash } from "hacknet/helpers.js"
const maxLevel = 200

async function upgradeLevel(ns, node, id, level) {
  if (node.level >= level) {
    return;
  }
  let cost = ns.hacknet.getLevelUpgradeCost(id, 2)
  ns.print('Upgrading level, costs ' + ns.nFormat(cost, "$0.000a"))
  await waitForCash(ns, cost);
  ns.hacknet.upgradeLevel(id, 2)
}

async function upgradeTo(ns, totalCount) {
  let total, node;
  while (true) {
    total = ns.hacknet.numNodes()
    for (let i = 0; i < total; i++) {
      node = ns.hacknet.getNodeStats(i)
      ns.print('Upgrading ' + node.name)
      await upgradeLevel(ns, node, i, maxLevel)
    }
    if (total >= totalCount && node.level == maxLevel) {
      ns.tprint("Hacknet Node Levels upgraded to max. Godspeed, Runner.")
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
