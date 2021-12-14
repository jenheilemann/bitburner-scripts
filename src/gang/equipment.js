import { 
  getNsDataThroughFile as fetch,
} from 'helpers.js'
import { gangEquipment } from 'constants.js'

const hackerEquipment = ['rootkits', 'vehicles']
const combatEquipment = [ 'weapons', 'armor', 'vehicles']

/** @param {NS} ns **/
export async function main(ns) {
  const gangInfo = await fetch(ns, `ns.getGangInformation()`, '/Temp/gangInfo.txt')
  const members = await fetch(ns, `ns.getMemberNames()`, '/Temp/gangMembers.txt')
  const equipTypes = gangInfo.isHacker ? hackerEquipment : combatEquipment
  const desired = []
  equipTypes.forEach(type => desired.concat(
    gangEquipment[type].map(obj => return { name: obj, type: type})
  ))
  const command = JSON.stringify(desired) + 
    `.map(equip => { ` +
      `equip.cost = ns.gang.getEquipmentCost(equip.name); ` +
      `return equip; ` +
    `})`
  desired = await fetch(ns, command, '/Temp/gangEquipCost.txt' )
}
