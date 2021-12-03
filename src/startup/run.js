import {
        tryRun,
        disableLogs,
        getNsDataThroughFile as fetch,
        setLSItem,
        clearLSItem,
      } from 'helpers.js'

const valuesToRemove = ['nmap', 'reserve', 'player']

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ["sleep"])

  valuesToRemove.map((value) => clearLSItem(value))
  await ns.sleep(5)
  ns.tprint(`Cleaned up localStorage.`)

  ns.tprint(`Fetching bitnode multipliers`)
  const bn = await fetch(ns, `ns.getBitNodeMultipliers()`, '/Temp/bitnode.txt')
  setLSItem('bitnode', bn)
  await ns.sleep(200)

  ns.tprint(`Starting satellites/controller.js`)
  ns.run('/satellites/controller.js')

  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
