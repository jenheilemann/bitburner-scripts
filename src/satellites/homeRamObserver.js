import {
  fetchPlayer,
  reserve,
  announce,
  getLSItem,
  canUseSingularity
} from 'helpers.js'
import { fetchServerFree } from 'network.js'


/** @param {NS} ns **/
export async function main(ns) {
  ns.print("------------------------")

  var mult = getLSItem("bitnode")["HomeComputerRamCost"]
  var serverData = fetchServerFree('home')
  var ram = serverData.maxRam
  var cost = Math.ceil(ram * 3.2 * mult * Math.pow(10,4) * Math.pow(1.58, Math.log2(ram)))
  ns.print("Cost: $" + ns.formatNumber(cost, 3))
  var player = fetchPlayer()
  ns.print("Player money: $" + ns.formatNumber(player.money, 3))

  if ((player.money - reserve(ns)) < cost) {
    ns.print("Too expensive to justify, maybe later.")
    return
  }

  ns.print("available ram: " + (ram - serverData.ramUsed))
  ns.print("script ram cost: " + ns.getScriptRam('upgradeHomeRam.js'))

  if (canUseSingularity(2) && ns.getScriptRam('upgradeHomeRam.js') < (ram - serverData.ramUsed)) {
    announce(ns, 'Attempting to automatically upgrade home ram.', 'info')
    ns.spawn('upgradeHomeRam.js', {spawnDelay: 100})
  } else {
    announce(ns, 'Upgrade home RAM manually, see Alpha Enterprises in Sector 12', 'warning')
  }
}
