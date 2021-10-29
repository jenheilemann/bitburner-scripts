const hacknetGoal = 10
const maxLevel = 200
const maxRam = 64
const maxCores = 16

function myMoney(ns) {
  return ns.getServerMoneyAvailable('home')
}

export class Hacknet {
  constructor(ns) {
    this.ns = ns
  }

  async waitForCash(cost) {
    this.ns.print("Waiting for " + this.ns.nFormat(cost, "$0.000a"))
    while (myMoney(this.ns) < cost) {
      await this.ns.sleep(3000)
    }
  }

  async buyNodes(goal) {
    let nodeId, cost;
    while (this.ns.hacknet.numNodes() < goal) {
      cost = this.ns.hacknet.getPurchaseNodeCost()
      this.ns.print('Buying next server, costs ' + this.ns.nFormat(cost, "$0.000a"))
      await this.waitForCash(cost)
      nodeId = this.ns.hacknet.purchaseNode()
      this.ns.print("Purchased node with id of " + nodeId)
    }
  }

  async upgradeLevel(node, num, level) {
    if (node.level >= level) {
      return;
    }
    let cost = this.ns.hacknet.getLevelUpgradeCost(num, 2)
    this.ns.print('Upgrading level, costs ' + this.ns.nFormat(cost, "$0.000a"))
    await this.waitForCash(cost);
    this.ns.hacknet.upgradeLevel(num, 2)
  }

  async upgradeRam(node,num, ram) {
    if (node.ram >= ram) {
      return
    }
    let cost = this.ns.hacknet.getRamUpgradeCost(num, 1)
    this.ns.print('Upgrading ram, costs ' + this.ns.nFormat(cost, "$0.000a"))
    await this.waitForCash(cost);
    this.ns.hacknet.upgradeRam(num, 1)
  }

  async upgradeCore(node, num, cores) {
    if (node.cores >= cores) {
      return
    }
    let cost = this.ns.hacknet.getCoreUpgradeCost(num, 1)
    this.ns.print('Upgrading cores, costs ' + this.ns.nFormat(cost, "$0.000a"))
    await this.waitForCash(cost)
    this.ns.hacknet.upgradeCore(num, 1)
  }

  async upgradeTo(maxLevel, maxRam, maxCores) {
    const total = this.ns.hacknet.numNodes()
    let node, cost;
    while (true) {
      for (let i = 0; i < total; i++) {
        node = this.ns.hacknet.getNodeStats(i)
        this.ns.print('Upgrading ' + node.name)
        await this.upgradeLevel(node, i, maxLevel)
        await this.upgradeRam(node, i, maxRam)
        await this.upgradeCore(node, i, maxCores)
      }
      if (node.level == maxLevel && node.ram == maxRam && node.cores == maxCores) {
        this.ns.tprint("Hacknet Nodes upgraded to max. Good luck, cowgirl.")
        return;
      }
      await this.ns.sleep(200)
    }
  }
}

export async function main(ns) {
  ns.disableLog("getServerMoneyAvailable")
  ns.disableLog("sleep")

  let hackNet = new Hacknet(ns)
  let goal = typeof (ns.args[0]) !== 'number' ? hacknetGoal : ns.args[0]
  await hackNet.buyNodes(goal)
  await hackNet.upgradeTo(maxLevel, maxRam, maxCores)
}
