import {
  getNsDataThroughFile as fetch,
  announce,
  getLSItem,
} from 'utils/helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  const gangInfo = getLSItem('gangMeta')
  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't recruit for a gang that doesn't exist

  const canRecruit = await fetch(ns, `ns.gang.canRecruitMember()`,
    `/Temp/gang.CanRecruitMember.txt`)
  if (!canRecruit)
    return // this gang can't recruit right now. enough respect? full roster?

  const nextMember = await getNextMemberName(ns, gangInfo.members.map(m => m.name))
  const result = await fetch(ns, `ns.gang.recruitMember('${nextMember}')`)
  if ( result === true )
    return announce(ns, `Recruited new Gang Member ${nextMember}`, 'success')
  announce(ns, `Problem recruiting gang member ${nextMember}`, 'warning')
}

/** @param {NS} ns **/
async function getNextMemberName(ns, members) {
  const last = members.pop()
  if ( last == undefined ) {
    return '0-Jane'
  }
  const next = Number.parseInt(last) + 1
  return `${next}-Jane`
}
