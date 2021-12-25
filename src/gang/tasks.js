import {
  getNsDataThroughFile as fetch,
  getLSItem,
  announce,
} from 'helpers.js'

Array.prototype.shuffle = function(b, c, d) {
  c=this.length;while(c)b=Math.random()*c--|0,d=this[c],this[c]=this[b],this[b]=d
}

/** @param {NS} ns **/
export async function main(ns) {
  const gangInfo = getLSItem('gangMeta')
  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't assign tasks to non-existant gang

  if ( gangInfo.members.length == 0 )
    return ns.print('no gang members')

  if ( gangInfo.members[0].task == 'Territory Warfare' )
    return ns.print('gang currently defending territory, skip assigning tasks.')

  const activityOrganizer = gangInfo.isHacker ? new HackingActivityOrganizer() :
                                                new CombatActivityOrganizer()

  const groupedMembers = membersBySkill(gangInfo.members, activityOrganizer.skill())
  let result = await setTask(ns, groupedMembers.trainees, activityOrganizer.learning())
  ns.print(`Trainees assignment result: ${result}`)

  const blackBelts = groupedMembers.blackBelts
  blackBelts.shuffle() // make sure the shit jobs get shared to everybody randomly
  const nWhiteHats = calculateHats(gangInfo, groupedMembers.blackBelts.length)
  const whiteHats = blackBelts.slice(0, nWhiteHats)
  const blackHats = blackBelts.slice(nWhiteHats)

  result = await setTask(ns, whiteHats, activityOrganizer.whiteHat())
  ns.print(`WhiteHats assignment result: ${result}`)

  result = await setTask(ns, blackHats, activityOrganizer.blackHat(gangInfo.taskPhase))
  ns.print(`BlackHats assignment result: ${result}`)
}

class HackingActivityOrganizer {
  skill()    {return 'hack'}
  learning() {return 'Train Hacking'}
  whiteHat() {return 'Ethical Hacking'}
  blackHat(phase) {
    switch (phase) {
      case 'money' :
        return 'Money Laundering'
      case 'respect' :
        return 'Cyberterrorism'
    }
  }
}

class CombatActivityOrganizer {
  skill() {return 'str'}
  learning() {return 'Train Combat'}
  whiteHat() {return 'Vigilante Justice'}
  blackHat(phase) {
    switch (phase) {
      case 'money' :
        return 'Human Trafficking'
      case 'respect' :
        return 'Terrorism'
    }
  }
}

async function setTask(ns, members, task) {
  const names = members.map(m => m.name)
  const cmd = `${JSON.stringify(names)}.map(m => ns.gang.setMemberTask(m, '${task}'))`
  return await fetch(ns, cmd, '/Temp/gang.setMemberTask.txt')
}

function membersBySkill(memberData, skill) {
  return memberData.reduce((groups, member) => {
    if (member[skill] > 300)
      groups.blackBelts.push(member)
    else
      groups.trainees.push(member)
    return groups
  }, { 'trainees': [], 'blackBelts': []})
}

function calculateHats(gangInfo, numMembers) {
  const penalty = Math.abs(1 - gangInfo.wantedPenalty)
  if ( numMembers == 0 )
    return 0

  // I decided that if wanted gain rate == 50% or more, I want all members
  // working to reduce it, and proportionate down to 0%.
  const percentWhite = Math.min(1, penalty * 2)
  return Math.round(percentWhite * numMembers)
}
