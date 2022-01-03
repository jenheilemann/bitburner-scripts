const filesToDownload = [
  '/contracts/arrayJumpingSolver.js',
  '/contracts/CodingContractWrapper.js',
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
  '/gang/clashRecorder.js',
  '/gang/equipment.js',
  '/gang/recruitment.js',
  '/gang/tasks.js',
  '/gang/warRunner.js',
  '/hacknet/coreUpgrader.js',
  '/hacknet/levelUpgrader.js',
  '/hacknet/ramUpgrader.js',
  '/hacknet/startup.js',
  '/qol/add-tab-control-to-editor.js',
  '/satellites/activityObserver.js',
  '/satellites/backdoorObserver.js',
  '/satellites/contractsObserver.js',
  '/satellites/controller.js',
  '/satellites/factionObserver.js',
  '/satellites/gangClashObserver.js',
  '/satellites/gangMetaObserver.js',
  '/satellites/hackerObserver.js',
  '/satellites/homeRamBuyer.js',
  '/satellites/playerObserver.js',
  '/satellites/programBuyer.js',
  '/satellites/programObserver.js',
  '/satellites/pservObserver.js',
  '/satellites/serversObserver.js',
  '/satellites/torBuyer.js',
  '/sleeves/manager.js',
  '/sleeves/metaObserver.js',
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
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/'


/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog("sleep")
  const args = ns.flags([['branch', 'main']])

  for ( let filename of filesToDownload ) {
    ns.scriptKill(filename, 'home')
    ns.rm(filename)
    await ns.sleep(50)
    await download(ns, filename, args.branch)
  }
  await ns.sleep(50)
  ns.tprint('Killed and deleted old scripts.')
  await ns.sleep(50)
  ns.tprint(`Files downloaded.`)

  await ns.sleep(50)
  ns.tprint(`Starting startup/run.js`)
  ns.spawn('/startup/run.js', 1)
}

export async function download(ns, filename, branch) {
  const fileUrl = filename.includes("/") ? filename : "/" + filename;
  const path = baseUrl + branch + '/src' + fileUrl
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}
