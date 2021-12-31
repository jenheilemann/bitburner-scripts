import {
  getNsDataThroughFile as fetch,
  setLSItem,
  getLSItem,
  haveSourceFile,
} from 'helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  if ( !haveSourceFile(10) )
    return ns.print('dont have source file 10')

  const sleeveData = getLSItem('sleeveMeta')
  if ( !sleeveData || sleeveData.length == 0 )
    return ns.print('no sleeves yet, wyd?')

  for ( const sleeve of sleeveData ) {
    await manageSleeve(ns, sleeve)
  }
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function manageSleeve(ns, sleeve) {
  if ( sleeve.stats.sync < 95 )
    return await syncronize(ns, sleeve)

  const gangMeta = getLSItem('gangMeta')
  if ( !gangMeta || !gangMeta.faction )
    return await assistJoiningGang(ns, sleeve)

  if ( sleeve.stats.shock > 0 )
    return await goToTherapy(ns, sleeve)

  return await farmIntelligence(ns, sleeve)
}

/**
 * @param {NS} ns
 * @param {object} sleeve
 **/
async function farmIntelligence(ns, sleeve) {
  if ( sleeve.task.crime == "Larceny" )
    return

  await fetch(ns, `ns.sleeve.setToCommitCrime(${sleeve.number}, "Larceny")`,
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
  return (((2*sleeve.stats.strength +
            2*sleeve.stats.defense +
            0.5*sleeve.stats.dexterity +
            0.5*sleeve.stats.agility ) / 975 ) / 1 )
}
