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

  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
