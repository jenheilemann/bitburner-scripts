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
  '/gang/ascend.js',
  '/gang/augments.js',
  '/gang/equipment.js',
  '/gang/recruitment.js',
  '/gang/task.js',
  '/hacknet/coreUpgrader.js',
  '/hacknet/levelUpgrader.js',
  '/hacknet/ramUpgrader.js',
  '/hacknet/startup.js',
  '/satellites/activityObserver.js',
  '/satellites/backdoorObserver.js',
  '/satellites/contractsObserver.js',
  '/satellites/controller.js',
  '/satellites/factionObserver.js',
  '/satellites/hackerObserver.js',
  '/satellites/homeRamBuyer.js',
  '/satellites/playerObserver.js',
  '/satellites/programBuyer.js',
  '/satellites/programObserver.js',
  '/satellites/pservObserver.js',
  '/satellites/serversObserver.js',
  '/satellites/torBuyer.js',
  '/startup/run.js',
  'augPurchaser.js',
  'backdoor.js',
  'bestHack.js',
  'botnet.js',
  'breadwinner.js',
  'buyer.js',
  'constants.js',
  'crime.js',
  'doProcess.js',
  'find.js',
  'grow.js',
  'hack.js',
  'helpers.js',
  'lsClear.js',
  'lsGet.js',
  'lsSet.js',
  'network.js',
  'networkMapper.js',
  'nuker.js',
  'rooter.js',
  'stats.js',
  'weaken.js',
  'workForFactions.js',
]
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/main/src'

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

  await ns.sleep(50)
  ns.tprint(`Starting startup/run.js`)
  ns.spawn('/startup/run.js', 1)
}

export async function download(ns, filename) {
  const fileUrl = filename.includes("/") ? filename : "/" + filename;
  const path = baseUrl + fileUrl
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}
