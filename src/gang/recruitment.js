import {
  getNsDataThroughFile as fetch,
  announce
} from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  const inAnyGang = await fetch(ns, `ns.gang.inGang()`, '/Temp/gang.inGang.txt')
  if ( !inAnyGang )
    return // can't recruit for a gang that doesn't exist

  const canRecruit = await fetch(ns, `ns.gang.canRecruitMember()`,
    `/Temp/gang.CanRecruitMember.txt`)
  if (!canRecruit)
    return // this gang can't recruit right now. enough respect? full membership?

  const nextMember = await getNextMemberName(ns)
  const result = await fetch(ns, `ns.gang.recruitMember('${nextMember}')`)
  if ( result === true )
    return announce(ns, `Recruited new Gang Member ${nextMember}`, 'success')
  announce(ns, `Problem recruiting gang member ${nextMember}`, 'warning')
}

/** @param {NS} ns **/
async function getNextMemberName(ns) {
  const members = await fetch(ns, `ns.gang.getMemberNames()`,
    `/Temp/gang.getMemberNames.txt`)
  const last = members.pop()
  if ( last == undefined ) {
    return '0-Jane'
  }
  const next = Number.parseInt(last) + 1
  return `${next}-Jane`
}