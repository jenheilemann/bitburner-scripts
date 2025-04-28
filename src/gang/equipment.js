import {
  getNsDataThroughFile as fetch,
  runCommand,
  myMoney,
  reserve,
  getLSItem,
} from 'utils/helpers.js'
import { gangEquipment } from 'utils/constants.js'

const hackerEquipment = ['rootkits', 'vehicles']
const combatEquipment = [ 'weapons', 'armor', 'vehicles']

/** @param {NS} ns **/
export async function main(ns) {
  const gangInfo = getLSItem('gangMeta')
  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't buy equipment for a gang that doesn't exist

  const members = gangInfo.members.map(m => m.name)
  const equipData = await getEquipmentData(ns, gangInfo.isHacker)

  for (const equip of equipData) {
    if ( myMoney(ns) < equip.cost*members.length + reserve(ns) )
      return ns.print('not enough money, try again later.')
    if ( gangInfo.members.every(m => m.upgrades.includes(equip.name))) {
      ns.print(`All members currently have a '${equip.name},' skipping for now...`)
      continue
    }
    ns.print(`Attempting to purchase ${equip.name} for gang members...`)
    const cmd = JSON.stringify(members) +
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
export function sortForHacking(a, b) {
  if ( a.stats.hack == b.stats.hack ) {
    if (b.stats.cha == a.stats.cha)
      return a.cost - b.cost
    return (b.stats.cha || 0) - (a.stats.cha || 0)
  }
  return (b.stats.hack || 0) - (a.stats.hack || 0)
}

/** @param {object} a, b **/
export function sortForCombat(a, b) {
  if ( a.stats.str == b.stats.str )
    return a.cost - b.cost
  return (b.stats.str || 0) - (a.stats.str || 0)
}
