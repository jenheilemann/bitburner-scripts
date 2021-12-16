import {
  getNsDataThroughFile as fetch,
  announce,
  formatNumber,
} from 'helpers.js'
// i like the fibonacci sequence
const threshholds = [2,3,5,8,13,21]

/** @param {NS} ns **/
export async function main(ns) {
  const inAnyGang = await fetch(ns, `ns.gang.inGang()`, '/Temp/inGang.txt')
  if ( !inAnyGang )
    return ns.print('no gang') // can't ascend members for a gang that doesn't exist

  const gangInfo = await fetch(ns, `ns.gang.getGangInformation()`, '/Temp/gangInfo.txt')
  const members  = await fetch(ns, `ns.gang.getMemberNames()`,     '/Temp/gangMembers.txt')
  if ( members.length == 0 )
    return ns.print('no members') // can't ascend no members

  const bestSkill = gangInfo.isHacker ? 'hack' : 'str'
  const memberData = await fetch(ns,
    `${JSON.stringify(members)}.map(m => ns.gang.getMemberInformation(m))`,
    '/Temp/gang.getMemberInformation.txt')
  const ascensionResults = await fetch(ns,
    `${JSON.stringify(members)}.map(m => ns.gang.getAscensionResult(m))`,
    '/Temp/gang.getAscensionResult.txt')
  ns.print(`best skill : ${bestSkill}`)
  ns.print(`members : ${members}`)

  const ascender = new Ascender(members, memberData, ascensionResults, bestSkill)
  await ascender.ascendGangMembers(ns)
}


class Ascender {
  /**
   * @param {string[]} members
   * @param {object[]} memberData
   * @param {object[]} ascTheoretical
   * @param {string} skill
   **/
  constructor(members, memberData, ascTheoretical, skill){
    this.keySkill = skill
    this.multKey = `${skill}_asc_mult`
    this.members = memberData
    this.members.forEach((d, i) => {
      d.name = members[i]
      d.ascResult = ascTheoretical[i]
    })
  }

  /** @param {NS} ns */
  async ascendGangMembers(ns) {
    ns.print(this.members.map(m => m.name))
    for ( const member of this.members) {
      ns.print(`Evaluating ${member.name}`)
      await this.ascendGangMember(ns, member)
    }
  }

  /**
   * @param {NS} ns
   * @param {object} member
   **/
  async ascendGangMember(ns, member) {
    if ( member.ascResult === undefined ) {
      return ns.print(`${member.name} cannot ascend at this time.`)
    }
    const currentMult = member[this.multKey]
    const nextThreshhold = threshholds.find(t => t > currentMult)
    const ascResult = member.ascResult[this.keySkill]*currentMult

    if ( nextThreshhold === undefined ) {
      return ns.print(`${member.name} has achieved mastery. ` +
        `(another ascension would be ${formatNumber(ascResult)}`)
    }

    ns.print(`${member.name}'s current ${this.keySkill} asc level is ` +
      `${currentMult}, next at ${nextThreshhold}`)
    ns.print(`Ascension result: ${this.keySkill} mult => ${ascResult}`)

    let result = false
    if ( ascResult > nextThreshhold ) {
      result = await fetch(ns, `ns.gang.ascendMember('${member.name}')`,
        '/Temp/gang.ascendMember.txt')
    } else {
      return ns.print(`${member.name} ascension multiplier too low to ascend`)
    }

    if (result)
      return announce(ns, `Gang member ${member.name} ascended, new multiplier is ${formatNumber(ascResult)}`)
    ns.tail()
    ns.print(`Member ${member} did not ascend?`)
    ns.print(ascensionResults[i])
  }
}
