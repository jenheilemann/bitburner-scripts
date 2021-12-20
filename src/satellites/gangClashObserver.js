import {
  getNsDataThroughFile as fetch,
  getLSItem,
  setLSItem,
  disableLogs,
  formatDuration,
  tryRun
} from 'helpers.js'
const sec = 1000

/** @param {NS} ns **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])

  const inAnyGang = await fetch(ns, `ns.gang.inGang()`, '/Temp/gang.inGang.txt')
  if ( !inAnyGang )
    return ns.print('no gang') // can't ascend members for a gang that doesn't exist

  let diff
  let nextClashTime = getLSItem('clashtime')
  if (nextClashTime < Date.now()) {
    diff = Date.now() - nextClashTime

    nextClashTime = findNextClashTime(nextClashTime)
    setLSItem('clashtime', nextClashTime)
    ns.print(`WARNING: Missed clashTime by ${formatDuration(diff)}, setting next ` +
      `to ${nextClashTime}`)
  }

  if ( nextClashTime && nextClashTime > Date.now() + 2*sec ) {
    ns.print(`Next clash time too far away, run again in ${
      formatDuration(nextClashTime-Date.now() - 2*sec)}.`)
    return
  }

  ns.print(`Trying to run clashRecorder.js...`)
  tryRun(ns, () => ns.run('/gang/clashRecorder.js'))
}

function findNextClashTime(curr) {
  if (curr < Date.now())
    return findNextClashTime(curr + 20*sec)
  return curr
}
