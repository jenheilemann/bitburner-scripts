import {
        disableLogs,
        getNsDataThroughFile as fetch,
        setLSItem,
        clearLSItem,
      } from 'helpers.js'

const staleLocalStorageKeys = [
  'nmap',
  'reserve',
  'player',
  'decommissioned',
  'hackpercent',
  'clashtime',
  'gangmeta',
  'sleevemeta',
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ["sleep"])

  staleLocalStorageKeys.map((value) => clearLSItem(value))
  await ns.sleep(5)
  ns.tprint(`Cleaned up localStorage.`)

  ns.tprint(`Fetching bitnode multipliers`)
  const bn = await fetch(ns, `ns.getBitNodeMultipliers()`, '/Temp/bitnode.txt')
  setLSItem('bitnode', bn)
  await ns.sleep(200)

  ns.tprint(`Fetching source file information`)
  const sf = await fetch(ns, `ns.singularity.getOwnedSourceFiles()`, '/Temp/getOwnedSourceFiles.txt')
  setLSItem('sourceFiles', sf)
  await ns.sleep(200)

  ns.tprint(`Running QoL scripts`)
  ns.run('/qol/add-tab-control-to-editor.js')
  await ns.sleep(200)

  ns.tprint(`Starting satellites/controller.js`)
  ns.run('/satellites/controller.js')
  await ns.sleep(200)

  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
