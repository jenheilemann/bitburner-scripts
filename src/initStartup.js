const valuesToRemove = ['jh_network_map', 'jh_reserve', 'jh_player']
const filesToDownload = [
  '/contracts/arrayJumpingSolver.js',
  '/contracts/failSolver.js',
  '/contracts/findValidExpressionsSolver.js',
  '/contracts/generateIpAddsSolver.js',
  '/contracts/mergeIntervalsSolver.js',
  '/contracts/minimumPathSumSolver.js',
  '/contracts/primeFactorSolver.js',
  '/contracts/sanitizeParensSolver.js',
  '/contracts/spiralizeMatrixSolver.js',
  '/contracts/stockTraderSolver.js',
  '/contracts/subarrayMaximumSolver.js',
  '/contracts/totalWaysToSumSolver.js',
  '/contracts/uniquePaths1Solver.js',
  '/contracts/uniquePaths2Solver.js',
  '/formulae/hacking.js',
  '/hacknet/coreUpgrader.js',
  '/hacknet/levelUpgrader.js',
  '/hacknet/ramUpgrader.js',
  '/hacknet/startup.js',
  '/satellites/backdoorObserver.js',
  '/satellites/contractsObserver.js',
  '/satellites/controller.js',
  '/satellites/playerObserver.js',
  '/satellites/programBuyer.js',
  '/satellites/programObserver.js',
  '/satellites/serversObserver.js',
  '/satellites/torBuyer.js',
  '/startup/run.js',
  'analyze-hack.js',
  'backdoor.js',
  'bestHack.js',
  'botnet.js',
  'breadwinner.js',
  'buyer.js',
  'constants.js',
  'crime.js',
  'find.js',
  'helpers.js',
  'lsClear.js',
  'lsGet.js',
  'lsSet.js',
  'network.js',
  'networkMapper.js',
  'rooter.js',
  'zombifier.js',
]
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/master/src'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog("sleep")

  for ( let filename of filesToDownload ) {
    ns.scriptKill(filename, 'home')
    ns.rm(filename)
    await ns.sleep(50)
    await download(ns, filename)
  }
  await ns.sleep(50)
  ns.tprint('Killed and deleted old scripts.')
  await ns.sleep(50)
  ns.tprint(`Files downloaded.`)

  valuesToRemove.map((value) => localStorage.removeItem(value))
  await ns.sleep(50)
  ns.tprint(`Cleaned up localStorage.`)

  await ns.sleep(50)
  ns.tprint(`Starting startup/run.js`)
  ns.spawn('/startup/run.js')
}

export async function download(ns, filename) {
  const fileUrl = filename.includes("/") ? filename : "/" + filename;
  const path = baseUrl + fileUrl
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}
