import {
  myMoney,
  reserve,
  announce,
  getNsDataThroughFile as fetch,
} from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  let cost = await fetch(ns, `ns.getUpgradeHomeRamCost()`)

  if ((myMoney(ns) - reserve(ns)) < cost) {
    return
  }

  let ret = await fetch(ns, 'ns.upgradeHomeRam()')
  if (ret) return announce(ns, 'Upgraded home ram automatically', 'success')
  announce(ns, 'Failed to upgrade home ram', 'failure')
}
