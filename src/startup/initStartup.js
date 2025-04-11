const filesToDownload = [
  '/batching/builder.js',
  '/batching/calculations.js',
  '/batching/queue.js',
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
  '/contracts/squareRootSolver.js',
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
  '/satellites/activityObserver.js',
  '/satellites/backdoorObserver.js',
  '/satellites/batchObserver.js',
  '/satellites/contractsObserver.js',
  '/satellites/controller.js',
  '/satellites/factionObserver.js',
  '/satellites/gangClashObserver.js',
  '/satellites/gangMetaObserver.js',
  '/satellites/homeRamObserver.js',
  '/satellites/networkObserver.js',
  '/satellites/playerObserver.js',
  '/satellites/programObserver.js',
  '/satellites/pservObserver.js',
  '/sleeves/manager.js',
  '/sleeves/metaObserver.js',
  '/startup/run.js',
  'augPurchaser.js',
  'backdoor.js',
  'batchGrow.js',
  'batchHack.js',
  'batchWeaken.js',
  'bestHack.js',
  'botnet.js',
  'breadwinner.js',
  'cleanupStaleScripts.js',
  'constants.js',
  'crime.js',
  'doProcess.js',
  'find.js',
  'helpers.js',
  'lsClear.js',
  'lsGet.js',
  'lsSet.js',
  'monitor.js',
  'network.js',
  'networkMapper.js',
  'nuker.js',
  'pServBuyer.js',
  'programBuyer.js',
  'rooter.js',
  'start.js',
  'stats.js',
  'torBuyer.js',
  'upgradeHomeRam.js',
  'workForFactions.js',
]
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/'


/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog("sleep")
  const args = ns.flags([['branch', 'main']])

  for ( let filename of ns.ls('home', '.js')) {
    if (filename == 'startup/initStartup.js') continue;
    if (filename == 'start.js') continue;
    ns.scriptKill(filename, 'home')
    ns.rm(filename)
  }
  for ( let filename of ns.ls('home', 'Temp')) {
    ns.rm(filename)
  }

  for ( let filename of filesToDownload ) {
    await ns.sleep(20)
    await download(ns, filename, args.branch)
  }
  await ns.sleep(50)
  ns.tprint('Killed and deleted old scripts.')
  await ns.sleep(50)
  ns.tprint(`Files downloaded.`)

  await ns.sleep(50)
  ns.tprint(`Starting startup/run.js`)
  ns.spawn('/startup/run.js', {spawnDelay: 1_000})
}

export async function download(ns, filename, branch) {
  const fileUrl = filename.includes("/") ? filename : "/" + filename;
  const path = baseUrl + branch + '/src' + fileUrl
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}
