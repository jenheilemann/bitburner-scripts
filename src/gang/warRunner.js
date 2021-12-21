import {
  announce,
} from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  const members = ns.gang.getMemberNames()
  ns.print('Attempting territory warfare')
  const workingMembers = members.filter(m => ns.gang.setMemberTask(m, 'Territory Warfare'))
  announce(ns, `${workingMembers.length} gang members assigned to territory warfare`)
}
