import {
  getNsDataThroughFile as fetch,
  announce
} from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  const inAnyGang = await fetch(ns, `ns.gang.inGang()`, '/Temp/inGang.txt')
  if (!inAnyGang)
    return // can't buy equipment for a gang that doesn't exist

  const gangInfo = await fetch(ns, `ns.gang.getGangInformation()`,
    '/Temp/gangInfo.txt')
  const members = await fetch(ns, `ns.gang.getMemberNames()`,
    '/Temp/gangMembers.txt')
  const memberData = await fetch(ns,
    `${JSON.stringify(members)}.map(m => ns.gang.getMemberInformation(m))`,
    '/Temp/gang.getMemberInformation.txt')
  const assignmentFxn = gangInfo.isHacker ? hackingAssignment : combatAssignment
  let newTask, result;

  for ( const member of memberData ) {
    newTask = assignmentFxn(member)
    if (member.task != newTask) {
      // result = await fetch(ns, `ns.gang.setMemberTask('${member.name}', '${newTask}')`, '/Temp/gang.setMemberTask.txt')
      result = ns.gang.setMemberTask(member.name, newTask)
      if ( result ) {
        announce(ns, `Assigned ${member.name} to new task: ${newTask}`, 'success')
      } else {
        ns.print(`Something went wrong assigning ${member.name} to ${newTask}`)
      }
    }
  }
}

function hackingAssignment() { }

function combatAssignment(member) {
  if ( member.str < 300 ) {
    return 'Train Combat'
  }

  const rand = Math.floor(Math.random() * 4)
  switch (rand) {
    case 0:
      return 'Terrorism'
    case 1:
      return 'Territory Warfare'
    case 2:
      return 'Vigilante Justice'
  }
  return member.task
}
