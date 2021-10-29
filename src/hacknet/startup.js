import { waitForCash } from "/hacknet/helpers.js"
const hacknetGoal = 5

async function buyNodes(ns, goal) {
  let nodeId, cost;
  while (ns.hacknet.numNodes() < goal) {
    cost = ns.hacknet.getPurchaseNodeCost()
    ns.print('Buying next server, costs ' + ns.nFormat(cost, "$0.000a"))
    await waitForCash(ns, cost)
    nodeId = ns.hacknet.purchaseNode()
    ns.print("Purchased node with id of " + nodeId)
  }
}

export async function main(ns) {
  ns.disableLog("getServerMoneyAvailable")
  ns.disableLog("sleep")

  let goal = typeof(ns.args[0]) !== 'number' ? hacknetGoal : ns.args[0]

  ns.run('/hacknet/levelUpgrader.js', 1, goal)
  ns.run('/hacknet/ramUpgrader.js', 1, goal)
  ns.run('/hacknet/coreUpgrader.js', 1, goal)

  await buyNodes(ns, goal)
  ns.tprint("Purchased " + goal + " hacknet nodes. Adios, amigo.")
}
