import { disableLogs } from 'helpers.js'

const crimes = [
  "shoplift",
  "rob store",
  "mug",
  "larceny",
  "deal drugs",
  "bond forgery",
  "traffick arms",
  "homicide",
  "grand theft auto",
  "kidnap",
  "assassinate",
  "heist",
]

const combatXPStats = [
  'strength_exp',
  'defense_exp',
  'dexterity_exp',
  'agility_exp'
]

const xpStats = [
  'hacking_exp',
  'charisma_exp',
  'intelligence_exp'
].concat(combatXPStats)

export function autocomplete(data, args) {
  return crimes.concat([
    'money',
    'xp',
    'karma',
    'hacking',
    'combat',
    'charisma'
  ])
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  ns.tail()
  let args = ns.flags([['focus', 'money']])
  let time = 1
  let again = true

  while(again) {
    ns.print( 'karma: ', ns.heart.break() )

    time = ns.commitCrime(chooseCrime(ns, args))
    await ns.sleep(time * 0.75)

    again = ns.isBusy()
    while(ns.isBusy()) await ns.sleep(100);
  }
}

function chooseCrime(ns, args) {
  if ( args._.length > 0 && crimes.includes( args._[0].toLowerCase() ) ) {
    return args._[0].toLowerCase()
  }
  let sorted = crimes.sort((a, b) => score(ns, args.focus, b) - score(ns, args.focus, a))
  return sorted[0]
}

function score(ns, focus, crime) {
  let stats = ns.getCrimeStats(crime)
  let value = focusValue( focus, stats)

  return ns.getCrimeChance(crime) * value/stats.time
}

function focusValue(focus, stats) {
  switch( focus ) {
    case 'karma' :
      return stats.karma
    case 'xp':
      return xpStats.reduce((prev, name) => stats[name] + prev, 0)
    case 'hacking':
      return stats.hacking_exp
    case 'combat':
      return combatXPStats.reduce((p, name) => stats[name] + prev, 0)
    case 'charisma':
      return stats.charisma_exp
    default:
      return stats.money
  }
}
