import {
  getNsDataThroughFile as fetch,
  getLSItem,
  haveSourceFile,
  fetchPlayer,
  formatNumberShort,
} from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  if ( !haveSourceFile(10) )
    return ns.print('dont have source file 10')

  const sleeveData = getLSItem('sleeveMeta')
  if ( !sleeveData || sleeveData.length == 0 )
    return ns.print('no sleeves yet, wyd?')

  for ( const sleeve of sleeveData ) {
    ns.print(`Managing activity for sleeve #${sleeve.number}:`)
    await manageSleeve(ns, sleeve)
  }
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function manageSleeve(ns, sleeve) {
  if ( sleeve.stats.sync < 95 ) {
    ns.print(`Sleeve sync at ${formatNumberShort(sleeve.stats.sync)}, syncronizing....`)
    return await syncronize(ns, sleeve)
  }

  const gangMeta = getLSItem('gangMeta')
  if ( !gangMeta || !gangMeta.faction ) {
    ns.print(`Not yet joined a gang, reducing karma`)
    return await assistJoiningGang(ns, sleeve)
  }

  // if ( sleeve.stats.shock > 0 )
  //   return await goToTherapy(ns, sleeve)

  const player = fetchPlayer()
  if ( ['strength', 'defense', 'dexterity', 'agility'].some(s => player[s] < 200 ) ) {
    ns.print(`some stat is less than 200, mugging.`)
    return await farmCombatStats(ns, sleeve)
  }

  ns.print(`farming int`)
  return await farmIntelligence(ns, sleeve)
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function farmIntelligence(ns, sleeve) {
  if ( bondForgeryChance(sleeve) > 0.75 ) {
    if ( sleeve.task.crime == 'Bond Forgery' )
      return ns.print(`Sleeve #${sleeve.number} already forging bonds.`)
    await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Bond Forgery")`,
      '/Temp/sleeve.setToCommitCrime.txt')
    return ns.print(`Sleeve #${sleeve.number} set to forging bonds.`)
  }

  if ( larcenyChance(sleeve) > 0.75 ) {
    if ( sleeve.task.crime == 'Larceny' )
      return ns.print(`Sleeve #${sleeve.number} already committing larceny.`)
    await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Larceny")`,
      '/Temp/sleeve.setToCommitCrime.txt')
    return ns.print(`Sleeve #${sleeve.number} set to larceny.`)
  }

  if ( sleeve.task.crime == "Rob Store" )
    return ns.print(`Sleeve #${sleeve.number} already robbing store.`)

  ns.print(`set to commit crime rob store`)
  await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Rob Store")`,
    '/Temp/sleeve.setToCommitCrime.txt')
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function farmCombatStats(ns, sleeve) {
  if ( sleeve.task.crime == "Mug" )
    return ns.print('already mugging')

  ns.print(`set to commit crime mug`)
  await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Mug")`,
    '/Temp/sleeve.setToCommitCrime.txt')
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function goToTherapy(ns, sleeve) {
  if ( sleeve.task.task == "Recovery" )
    return

  await fetch(ns, `ns.sleeve.setToShockRecovery(${sleeve.number})`,
    '/Temp/sleeve.setToShockRecovery.txt')
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function assistJoiningGang(ns, sleeve) {
  if ( homicideChance(sleeve) < 0.75 ) {
    if ( sleeve.task.crime == "Mug")
      return
    return await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Mug")`,
      '/Temp/sleeve.setToCommitCrime.txt')
  }

  if ( sleeve.task.crime == "Homicide" )
    return

  await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Homicide")`,
    '/Temp/sleeve.setToCommitCrime.txt')
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function syncronize(ns, sleeve) {
  if ( sleeve.task.task == 'Syncro' ) // already syncronizing!
    return

  return await fetch(ns, `ns.sleeve.setToSynchronize(${sleeve.number})`,
    '/Temp/sleeve.setToSynchronize.txt')
}

function homicideChance(sleeve) {
  const playerInt = fetchPlayer().intelligence
  const difficulty = 1
  return (((2*sleeve.stats.strength +
            2*sleeve.stats.defense +
            0.5*sleeve.stats.dexterity +
            0.5*sleeve.stats.agility +
            0.25*playerInt) / 975 ) / difficulty ) *
            (1+((1*(playerInt^0.8))/600))
}

function bondForgeryChance(sleeve) {
  const playerInt = fetchPlayer().intelligence
  const difficulty = 0.5

  return (((0.05*sleeve.stats.hacking +
    1.25*sleeve.stats.dexterity) / 975) / difficulty )*
    (1 + ((1*(playerInt^0.8))/600))
}

function larcenyChance(sleeve) {
  const playerInt = fetchPlayer().intelligence
  const difficulty = 0.33

  return (((0.5*sleeve.stats.hacking +
    1*sleeve.stats.dexterity +
    1*sleeve.stats.agility) / 975) / difficulty )*
    (1 + ((1*(playerInt^0.8))/600))
}
