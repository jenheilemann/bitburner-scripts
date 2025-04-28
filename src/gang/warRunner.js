import {
  getLSItem,
  announce,
  disableLogs,
} from 'utils/helpers.js'
const buffer = 100 //ms

/** @param {NS} ns **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  const gangInfo = getLSItem('gangMeta')

  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't war without a gang

  if ( gangInfo.warPhase == 'peace' ) {
    if ( members[0].task == 'Territory Warfare' )
      members.map(m => ns.gang.setMemberTask(m, 'Terrorism'))
    return ns.print('we have conquered all')
  }

  const bufferedClashTime = getLSItem('clashTime') + buffer
  if ( bufferedClashTime < Date.now() )
    return ns.print('clash time has passed, whoops!')

  const members = gangInfo.members.map(m => m.name)
  ns.print('Attempting territory warfare with ' + JSON.stringify(members))
  let workingMembers = members.filter(m => ns.gang.setMemberTask(m, 'Territory Warfare'))
  announce(ns, `${workingMembers.length} gang members assigned to territory warfare`)

  if ( ns.gang.getBonusTime() > 10 ) {
    return ns.print('gang in bonus time right now, just take territory for a while.')
  }

  ns.print('Waiting for clashtime to pass...')
  while(bufferedClashTime > Date.now()) {
    await ns.sleep(1)
  }

  workingMembers = gangInfo.members.filter(m => ns.gang.setMemberTask(m.name, m.task))
  announce(ns, `${workingMembers.length} gang members assigned back to their tasks`)
}
