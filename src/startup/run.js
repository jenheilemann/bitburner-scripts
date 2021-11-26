import {
        tryRun,
        disableLogs,
        getNsDataThroughFile as fetch,
        setLSItem,
      } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ["sleep"])

  ns.tprint(`Fetching bitnode multipliers`)
  const bn = await fetch(ns, `ns.getBitNodeMultipliers()`, '/Temp/bitnode.txt')
  setLSItem('bitnode', bn)
  await ns.sleep(200)

  ns.tprint(`Starting satellites/controller.js`)
  ns.run('/satellites/controller.js')
  await ns.sleep(1000) // just give it a sec

  ns.tprint(`Starting buyer.js`)
  await tryRun(ns, () => ns.run('buyer.js'))

  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
