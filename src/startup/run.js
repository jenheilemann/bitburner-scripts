import { getLSItem, tryRun } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog("sleep")

  /** this bit won't work until BN5 **/
  // let multipliers = getLSItem('multipliers')
  // if ( multipliers === undefined || player.playtimeSinceLastBitnode < (5*60*1000) ) {
  //   ns.tprint(`Fetching Bitnode Multipliers`)
  //   ns.run('/startup/bitnode.js', 1)
  //   await ns.sleep(200)
  // }

  ns.tprint(`Starting satellites/controller.js`)
  ns.run('/satellites/controller.js')
  await ns.sleep(200) // just give it a sec

  ns.tprint(`Starting botnet.js`)
  await tryRun(ns, () => ns.run('botnet.js'))

  ns.tprint(`Starting hacknet/startup.js`)
  await tryRun(ns, () => ns.run('/hacknet/startup.js'))

  ns.tprint(`Starting buyer.js`)
  await tryRun(ns, () => ns.run('buyer.js'))

  ns.tprint(`Starting contracts/scanner.js`)
  await tryRun(ns, () => ns.run('/contracts/scanner.js'))

  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
