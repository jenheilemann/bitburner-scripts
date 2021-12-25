import {
  getNsDataThroughFile as fetch,
  runCommand,
  myMoney,
  reserve,
  getLSItem,
} from 'helpers.js'
import { gangEquipment } from 'constants.js'
import { sortForHacking, sortForCombat } from '/gang/equipment.js'


/** @param {NS} ns **/
export async function main(ns) {
  const gangInfo = getLSItem('gangMeta')
  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't buy augments for a gang that doesn't exist

  const members = gangInfo.members.map(m => m.name)
  const augData = await getAugData(ns, gangInfo.isHacker)

  for (const aug of augData) {
    if ( myMoney(ns) < aug.cost*members.length + reserve(ns) )
      return // all done for now
    if ( gangInfo.members.every(m => m.augmentations.includes(aug.name) ) ) {
      ns.print(`All gang members have '${aug.name},' skipping for now...`)
      continue
    }
    ns.print(`Attempting to purchase ${aug.name} for gang members...`)
    const cmd = JSON.stringify(members) +
      `.forEach(m => ns.print( ns.gang.purchaseEquipment(m, ns.args[0])))`
    await runCommand(ns, cmd, '/Temp/gang.purchaseEquipment.js', false, 1, aug.name)
  }
}

/**
 * @param {NS} ns
 * @param {boolean} isHacker
 **/
async function getAugData(ns, isHacker) {
  const augTypes = isHacker ? gangEquipment.hackAugs : gangEquipment.combatAugs
  let desired = augTypes.map(obj => { return {name: obj} })

  const command = (arr, prop, cmdString) => {
    return JSON.stringify(arr) +
    `.map(equip => { ` +
      `equip.${prop} = ns.gang.${cmdString}(equip.name); ` +
      `return equip; ` +
    `})`
  }
  desired = await fetch(ns, command(desired, 'cost', 'getEquipmentCost' ),
    '/Temp/gang.getEquipmentCost.txt' )
  desired = await fetch(ns, command(desired, 'stats','getEquipmentStats'),
    '/Temp/gang.gangEquipStats.txt' )
  desired.sort(isHacker ? sortForHacking : sortForCombat)

  return desired
}
