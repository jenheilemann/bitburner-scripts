import {
          getNsDataThroughFile as fetch,
          fetchPlayer,
          disableLogs,
        } from 'helpers.js'

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
  let time = 1, again = true, crime
  let karma =  ns.heart.break()

  while (again) {
    crime = await chooseCrime(ns, args)
    time = await fetch(ns, `ns.commitCrime('${crime}')`)
    ns.print(`Attempting ${crime} in ${ns.tFormat(time)}...`)
    await ns.sleep(time * 0.75)

    again = fetchPlayer().busy
    while (fetchPlayer().busy) {
      await ns.sleep(50)
    }

    if ( ns.heart.break() < karma ){
      ns.print(`SUCCESS: ${crime}`)
    } else {
      ns.print(`FAILURE: ${crime}`)
    }
    ns.print('karma: ', karma = ns.heart.break())
  }
}

async function chooseCrime(ns, args) {
  if (args._.length > 0 && crimes.includes(args._[0].toLowerCase())) {
    return args._[0].toLowerCase()
  }
  const stats = []
  let score = 0
  for ( let crime of crimes ) {
    score = await calcScore(ns, args.focus, crime)
    stats.push({name: crime, score: score})
  }
  let sorted = stats.sort((a, b) =>  b.score - a.score)
  return sorted[0].name
}

async function calcScore(ns, focus, crime) {
  let stats = await fetch(ns, `ns.getCrimeStats('${crime}')`, `/Temp/crimeStats.txt`)
  let value = focusValue(focus, stats)
  let chance = await fetch(ns, `ns.getCrimeChance('${crime}')`,`/Temp/crimeChance.txt`)

  return chance * value / stats.time
}

function focusValue(focus, stats) {
  switch (focus) {
    case 'karma':
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

