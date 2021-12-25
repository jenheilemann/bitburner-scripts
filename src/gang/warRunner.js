import {
  getLSItem,
  announce,
  disableLogs,
} from 'helpers.js'
const buffer = 100 //ms

/** @param {NS} ns **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  const gangInfo = getLSItem('gangMeta')
  const bufferedClashTime = getLSItem('clashTime') + buffer

  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't war without a gang

  if ( gangInfo.warPhase == 'peace' )
    return ns.print('we have conquered all')

  const members = gangInfo.members.map(m => m.name)
  ns.print('Attempting territory warfare with ' + JSON.stringify(members))
  let workingMembers = members.filter(m => ns.gang.setMemberTask(m, 'Territory Warfare'))
  announce(ns, `${workingMembers.length} gang members assigned to territory warfare`)

  ns.print('Waiting for clashtime to pass...')
  while(bufferedClashTime > Date.now()) {
    await ns.sleep(1)
  }

  workingMembers = gangInfo.members.filter(m => ns.gang.setMemberTask(m.name, m.task))
  announce(ns, `${workingMembers.length} gang members assigned back to their tasks`)
}
