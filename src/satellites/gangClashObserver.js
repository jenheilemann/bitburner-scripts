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

  const gangInfo = getLSItem('gangMeta')
  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't clash a gang that doesn't exist

  let nextClashTime = getLSItem('clashtime')
  let diff = Date.now() - nextClashTime
  ns.print(`Next clash time: ${nextClashTime}`)
  ns.print(`Diff to now: ${formatDuration(diff)}`)

  if (nextClashTime && nextClashTime < Date.now()) {
    nextClashTime = findNextClashTime(nextClashTime)
    setLSItem('clashtime', nextClashTime)
    ns.print(`WARNING: Missed clashTime by ${formatDuration(diff)}, setting next ` +
      `to ${nextClashTime}`)
  }

  if ( nextClashTime && nextClashTime > Date.now() + 1*sec ) {
    ns.print(`Next clash time too far away, run again in ${
      formatDuration(nextClashTime-Date.now() - 1*sec)}.`)
    return
  }

  ns.print(`Trying to run clashRecorder.js...`)
  ns.run('/gang/clashRecorder.js')

  ns.print(`Waiting for next clash time.. (${nextClashTime - Date.now()}).`)
  while(nextClashTime - Date.now() > 200 ) {
    await ns.sleep(5)
  }
  ns.print(`Clash time arrived! (${nextClashTime - Date.now()})`)

  ns.print('Trying to run gang/warRunner....')
  await tryRun(() => ns.run('/gang/warRunner.js'))
}

function findNextClashTime(curr) {
  if (curr < Date.now())
    return findNextClashTime(curr + 20*sec)
  return curr
}
