import {
  getNsDataThroughFile as fetch,
  runCommand,
  myMoney,
  reserve,
} from 'helpers.js'
import { gangEquipment } from 'constants.js'

const hackerEquipment = ['rootkits', 'vehicles']
const combatEquipment = [ 'weapons', 'armor', 'vehicles']

/** @param {NS} ns **/
export async function main(ns) {
  const gangInfo = await fetch(ns, `ns.gang.getGangInformation()`, '/Temp/gangInfo.txt')
  const members  = await fetch(ns, `ns.gang.getMemberNames()`,     '/Temp/gangMembers.txt')
  const equipData = await getEquipmentData(ns, gangInfo.isHacker)

  for (const equip of equipData) {
    if ( myMoney(ns) < equip.cost*members.length + reserve(ns) )
      return // all done for now
    ns.print(`Attempting to purchase ${equip.name} for gang members...`)
    var cmd = JSON.stringify(members) +
      `.forEach(m => ns.print( ns.gang.purchaseEquipment(m, ns.args[0])))`
    await runCommand(ns, cmd, '/Temp/gangEquipPurchase.js', false, 1, equip.name)
  }
}

/**
 * @param {NS} ns
 * @param {boolean} isHacker
 **/
async function getEquipmentData(ns, isHacker) {
  const equipTypes = isHacker ? hackerEquipment : combatEquipment
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

/** @param {object} a, b **/
function sortForHacking(a, b) {
  if ( a.stats.hack == b.stats.hack ) {
    if (b.stats.cha == a.stats.cha)
      return a.cost - b.cost
    return b.stats.hack - a.stats.hack
  }
  return b.stats.hack - a.stats.hack
}

/** @param {object} a, b **/
function sortForCombat(a, b) {
  if ( a.stats.str == b.stats.str )
    return a.cost - b.cost
  return b.stats.str - a.stats.str
}
