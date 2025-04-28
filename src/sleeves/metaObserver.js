import {
  getNsDataThroughFile as fetch,
  setLSItem,
  getLSItem,
  haveSourceFile,
} from 'utils/helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  if ( !haveSourceFile(10) )
    return ns.print('dont have source file 10')

  const numSleeves = await fetch(ns, `ns.sleeve.getNumSleeves()`,
    '/Temp/sleeve.getNumSleeves.txt')

  if ( numSleeves < 1 )
    return ns.print('no sleeves to manage, probably should get some....')

  const counter = [...Array(numSleeves).keys()] // shortcut for [0,1,2...numSleeves]
  const sleeves = await fetchData(ns, 'sleeve.getInformation', counter)
  ns.print(`Found data for ${sleeves.length} sleeves`)

  mergeData(sleeves, 'number', counter)
  mergeData(sleeves, 'augs', await fetchData(ns, 'sleeve.getSleeveAugmentations', counter))
  mergeData(sleeves, 'stats', await fetchData(ns, 'sleeve.getSleeveStats', counter))
  mergeData(sleeves, 'task', await fetchData(ns, 'sleeve.getTask', counter))

  setLSItem('sleeveMeta', sleeves)
  ns.print(getLSItem('sleeveMeta'))
  ns.print('Set augs, stats, and tasks for sleeve data.')
}

/**
 * @param {NS} ns
 * @param {string} command
 * @param {number[]} counter
 **/
async function fetchData(ns, command, counter) {
  return await fetch(ns,
    `${JSON.stringify(counter)}.map(n => ns.${command}(n))`,
    `/Temp/${command}.txt`)
}

/**
 * @param {object[]} arrSleeves - the array of sleeve data
 * @param {string} prop -  the property to add to each sleeve object
 * @param {object[]} data - the array of data associated with each sleeve
 **/
function mergeData(arrSleeves, prop, data) {
  arrSleeves.forEach((sleeve, ndx) => sleeve[prop] = data[ndx])
}
