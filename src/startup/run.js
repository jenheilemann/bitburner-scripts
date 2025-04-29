import {
        disableLogs,
        getNsDataThroughFile as fetch,
        setLSItem,
        clearLSItem,
      } from 'utils/helpers.js'
import { myFavTheme } from 'utils/constants.js'
import { getBitnodeMultipliers } from 'utils/formulas.js'

const staleLocalStorageKeys = [
  'nmap',
  'reserve',
  'reset',
  'batches',
  'batchJobID',
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
  ns.tprint("--------------------------------------")

  ns.tprint(`Cleaning up localStorage.`)
  staleLocalStorageKeys.map((value) => clearLSItem(value))
  await ns.sleep(20)

  ns.tprint(`Setting favorite theme`)
  ns.ui.setTheme(myFavTheme)
  await ns.sleep(20)

  ns.tprint(`Fetching reset info`)
  const reset = await fetch(ns, `ns.getResetInfo()`, '/Temp/reset-info.txt')
  setLSItem('reset', reset)
  await ns.sleep(100)

  ns.tprint(`Setting hackPercent to 1 (about 5% baseline)`)
  setLSItem('hackPercent', 1)
  await ns.sleep(100)

  const bn = getBitnodeMultipliers(reset.currentNode, getSourceFileLevel(reset))
  setLSItem('bitnode', bn)
  await ns.sleep(10)

  ns.tprint(`Setting source file information`)
  const sf = reset.ownedSF
  setLSItem('sourceFiles', sf)
  await ns.sleep(10)

  ns.tprint(`Initializing the Player data`)
  const player = await fetch(ns, `ns.getPlayer()`, '/Temp/getPlayer.txt')
  setLSItem('player', player)
  await ns.sleep(10)

  ns.tprint(`Initializing the Network Map`)
  ns.run('satellites/networkObserver.js')
  await ns.sleep(100)

  ns.tprint(`Starting controller.js`)
  ns.run('/satellites/controller.js')
  ns.tprint(`Startup completed. May your pillow always be cool.`)
}


/**
 * @param {ResetInfo} reset
 * Figures out which source file level we're currently in
 **/
function getSourceFileLevel(reset) {
  const bitNodeN = reset.currentNode
  if ( reset.bitNodeOptions.sourceFileOverrides.has(bitNodeN)) {
    return reset.bitNodeOptions.sourceFileOverrides.get(bitNodeN) ?? 0;
  }
  return reset.ownedSF.get(bitNodeN) ?? 0
}
