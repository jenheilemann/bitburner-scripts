import {
  getNsDataThroughFile as fetch,
  runCommand,
  setLSItem,
  getLSItem,
  announce,
} from 'helpers.js'
let gangInfo;

/** @param {NS} ns **/
export async function main(ns) {
  const inAnyGang = await fetch(ns, `ns.gang.inGang()`, '/Temp/gang.inGang.txt')
  if ( !inAnyGang ) {
    setLSItem('gangMeta', { faction: false })
    return ns.print('no gang') // can't gather data for no gang
  }

  gangInfo = await fetch(ns, `ns.gang.getGangInformation()`,
    '/Temp/gang.getGangInformation.txt')

  gangInfo.members = await fetch(ns,
    `ns.gang.getMemberNames().map(m => ns.gang.getMemberInformation(m))`,
    '/Temp/gang.getMemberInformation.txt')
  gangInfo.otherGangs = await fetch(ns, `ns.gang.getOtherGangInformation()`,
    '/Temp/gang.getOtherGangInformation.txt')

  gangInfo.taskPhase = await findTaskPhase(ns, gangInfo)
  gangInfo.warPhase = await findWarPhase(ns, gangInfo)

  await adjustTerritoryWarfare(ns, gangInfo)

  setLSItem('gangMeta', gangInfo)
  ns.print(getLSItem('gangMeta'))
}

async function findWarPhase(ns, gangInfo) {
  if ( gangInfo.territory == 1 )
    return 'peace'

  const otherGangs = Object.keys(gangInfo.otherGangs).filter(g => g != gangInfo.faction)
  const chances = await fetch(ns,
    `Object.fromEntries(${JSON.stringify(otherGangs)}.map(g => [g, ns.gang.getChanceToWinClash(g)]))`,
    '/Temp/gang.getChanceToWinClash.txt')
  const minChance = Math.max(0, ...otherGangs.map(g => chances[g]))
  if ( minChance > 0.7 )
    return 'war'

  return 'posturing'
}

async function findTaskPhase(ns, gangInfo) {
  if ( await metFactionRepRequirements(ns, gangInfo.faction) ) {
    return 'money'
  }

  return 'respect'
}

async function metFactionRepRequirements(ns, faction) {
  const allAugs = await fetch(ns, `ns.getAugmentationsFromFaction('${faction}')`,
    '/Temp/faction-augs.txt')
  const owned = await fetch(ns, 'ns.getOwnedAugmentations(true)',
      '/Temp/getOwnedAugmentations.txt')
  const unownedAugs = allAugs.filter(a => !owned.includes(a))
  const reputation = await fetch(ns, `ns.getFactionRep('${faction}')`,
      '/Temp/faction-rep.txt')

  const augRepReqs = await fetch(ns,
    `${JSON.stringify(unownedAugs)}.map(aug => ns.getAugmentationRepReq(aug))`,
    '/Temp/aug-repreqs.txt')
  const max = Math.max(0, ...augRepReqs)
  return reputation > max
}

async function adjustTerritoryWarfare(ns, gangInfo) {
  if ( gangInfo.warPhase == 'war' && !gangInfo.territoryWarfareEngaged ) {
    await runCommand(ns, 'ns.gang.setTerritoryWarfare(ns.args[0])',
      '/Temp/gang.setTerritoryWarfare.js', false, 1, true)
    gangInfo.territoryWarfareEngaged = true
    announce(ns, 'Engaging territory warfare!', 'error')
  }
  if ( gangInfo.warPhase != 'war' && gangInfo.territoryWarfareEngaged ) {
    await runCommand(ns, 'ns.gang.setTerritoryWarfare(ns.args[0])',
      '/Temp/gang.setTerritoryWarfare.js', false, 1, false)
    gangInfo.territoryWarfareEngaged = false
    announce(ns, 'Disengaging from territory war.', 'warning')
  }
}
