import {
  getLSItem,
  disableLogs,
  formatDuration,
  tryRun,
} from 'helpers.js'
const sec = 1000

/** @param {NS} ns **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let nextClashTime = getLSItem('clashtime')
  if ( !nextClashTime )
    return ns.print(`No clash time set, skipping until it's detected.`)

  if ( nextClashTime < Date.now() )
    return ns.print(`ClashCycle has passed, waiting for next.`)

  if ( nextClashTime > Date.now() + 1*sec )
    return ns.print(`Next clash time too far away, run again in ${
      formatDuration(nextClashTime-Date.now() - 1*sec)}.`)

  ns.print(`Waiting for next clash time...`)
  while(nextClashTime > Date.now() + 400) {
    await ns.sleep(5)
  }

  await tryRun(() => ns.run('/gang/warRunner.js'))
  ns.print('SUCCESS: ran gang/warRunner')
}
