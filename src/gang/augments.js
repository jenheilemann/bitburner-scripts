import {
  getNsDataThroughFile as fetch,
  runCommand,
  myMoney,
  reserve,
} from 'helpers.js'
import { gangEquipment } from 'constants.js'
import { sortForHacking, sortForCombat } from '/gang/equipment.js'


/** @param {NS} ns **/
export async function main(ns) {
  const inAnyGang = await fetch(ns, `ns.gang.inGang()`, '/Temp/gang.inGang.txt')
  if ( !inAnyGang )
    return // can't buy augments for a gang that doesn't exist

  const gangInfo = await fetch(ns, `ns.gang.getGangInformation()`,
    '/Temp/gang.getGangInformation.txt')
  const members  = await fetch(ns, `ns.gang.getMemberNames()`,
    '/Temp/gang.getMemberNames.txt')
  const augData = await getAugData(ns, gangInfo.isHacker)
  return ns.tprint(augData)

  for (const aug of augData) {
    if ( myMoney(ns) < aug.cost*members.length + reserve(ns) )
      return // all done for now
    ns.print(`Attempting to purchase ${aug.name} for gang members...`)
    const cmd = JSON.stringify(members) +
      `.forEach(m => ns.print( ns.gang.purchaseEquipment(m, ns.args[0])))`
    await runCommand(ns, cmd, '/Temp/gangEquipPurchase.js', false, 1, aug.name)
  }
}

/**
 * @param {NS} ns
 * @param {boolean} isHacker
 **/
async function getAugData(ns, isHacker) {
  const augTypes = isHacker ? gangEquipment.hackAugs : gangEquipment.combatAugs
  let eq, desired = []
  for (const type of equipTypes) {
    eq = gangEquipment[type].map(obj => { return {name: obj, type: type} })
    desired.push(...eq)
  }
  const command = (arr, prop, cmdString) => {
    return JSON.stringify(arr) +
    `.map(equip => { ` +
      `equip.${prop} = ns.gang.${cmdString}(equip.name); ` +
      `return equip; ` +
    `})`
  }
  desired = await fetch(ns, command(desired, 'cost', 'getEquipmentCost' ), '/Temp/gangEquipCost.txt' )
  desired = await fetch(ns, command(desired, 'stats','getEquipmentStats'), '/Temp/gangEquipStats.txt' )
  desired.sort(isHacker ? sortForHacking : sortForCombat)

  return desired
}
