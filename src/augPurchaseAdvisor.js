import { disableLogs, getNsDataThroughFile as fetch } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  ns.tail()

  function dictCommand(list, cmd) {
    return `Object.fromEntries(${JSON.stringify(list)}.map(o => [o, ${cmd}]))`
  }

  const ownedAugs = await fetch(ns, `ns.getOwnedAugmentations(true)`)
  const factions = await fetch(ns, `ns.getPlayer().factions`)

  let cmd = dictCommand(factions, 'ns.getAugmentationsFromFaction(o)')
  const factionAugs = await fetch(ns, cmd, '/Temp/factionAugs.txt')
  const augmentationNames = [...new Set(Object.values(factionAugs).flat())]

  cmd = dictCommand(augmentationNames, 'ns.getAugmentationCost(o)')
  const augCosts = await fetch(ns, cmd, '/Temp/augCosts.txt')

  let fa, augs = []
  for ( const faction in factionAugs ) {
    ns.print(faction, ": ", factionAugs[faction])
    fa = factionAugs[faction].filter(a => !ownedAugs.includes(a))
    augs.push(... fa.map(a => { return { name: a, cost: augCosts[a], faction: faction}}))
  }
  augs.sort((a, b) => b.cost[1] - a.cost[1] )

  for (let aug of augs) {
    ns.print(`${ns.nFormat(aug.cost[1], '$0,0')} - ${aug.faction} - ${aug.name}`)
  }
}

