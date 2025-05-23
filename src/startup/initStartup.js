const filesToDownload = [
  'batching/builder.js',
  'batching/calculations.js',
  'batching/queue.js',
  'contracts/arrayJumpingSolver.js',
  'contracts/CodingContractWrapper.js',
  'contracts/compression1RLE.js',
  'contracts/encryption1CaesarCipher.js',
  'contracts/findValidExpressionsSolver.js',
  'contracts/generateIpAddsSolver.js',
  'contracts/hammingCodesBinToIntSolver.js',
  'contracts/mergeIntervalsSolver.js',
  'contracts/minimumPathSumSolver.js',
  'contracts/primeFactorSolver.js',
  'contracts/sanitizeParensSolver.js',
  'contracts/shortestPathSolver.js',
  'contracts/spiralizeMatrixSolver.js',
  'contracts/squareRootSolver.js',
  'contracts/stockTraderSolver.js',
  'contracts/subarrayMaximumSolver.js',
  'contracts/totalWaysToSumSolver.js',
  'contracts/uniquePaths1Solver.js',
  'contracts/uniquePaths2Solver.js',
  'gang/ascend.js',
  'gang/augments.js',
  'gang/clashRecorder.js',
  'gang/equipment.js',
  'gang/recruitment.js',
  'gang/tasks.js',
  'gang/warRunner.js',
  'hacknet/coreUpgrader.js',
  'hacknet/levelUpgrader.js',
  'hacknet/ramUpgrader.js',
  'hacknet/startup.js',
  'satellites/activityObserver.js',
  'satellites/backdoorObserver.js',
  'satellites/batchMetaObserver.js',
  'satellites/batchObserver.js',
  'satellites/contractsObserver.js',
  'satellites/controller.js',
  'satellites/factionObserver.js',
  'satellites/gangClashObserver.js',
  'satellites/gangMetaObserver.js',
  'satellites/homeRamObserver.js',
  'satellites/networkObserver.js',
  'satellites/playerObserver.js',
  'satellites/programObserver.js',
  'satellites/pservObserver.js',
  'satellites/shareObserver.js',
  'satellites/stanekObserver.js',
  'sleeves/manager.js',
  'sleeves/metaObserver.js',
  'startup/cleanup.js',
  'startup/run.js',
  'usr/find.js',
  'usr/lsClear.js',
  'usr/lsGet.js',
  'usr/lsSet.js',
  'utils/constants.js',
  'utils/formulas.js',
  'utils/helpers.js',
  'utils/network.js',
  'augPurchaser.js',
  'backdoor.js',
  'batchGrow.js',
  'batchHack.js',
  'batchWeaken.js',
  'bestHack.js',
  'botnet.js',
  'breadwinner.js',
  'cleanupStaleScripts.js',
  'crime.js',
  'doProcess.js',
  'monitor.js',
  'nuker.js',
  'pServBuyer.js',
  'programBuyer.js',
  'rooter.js',
  'share.js',
  'stats.js',
  'torBuyer.js',
  'upgradeHomeRam.js',
  'workForFactions.js',
]

const argsSchema = [
  ['branch', 'main']
];

export function autocomplete(data, args) {
  data.flags(argsSchema)
  return ['main'] // add any additional branches here if you are working on them
}

const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.disableLog("sleep")
  const args = ns.flags(argsSchema)

  for ( let filename of ns.ls('home', '.js')) {
    if (filename == 'startup/initStartup.js') continue;
    ns.scriptKill(filename, 'home')
    ns.rm(filename)
  }
  for ( let filename of ns.ls('home', 'Temp')) {
    ns.rm(filename)
  }

  ns.tprint(`INFO: Attempting to download files from ${baseUrl}:`)
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
  const path = baseUrl + branch + '/src/' + filename
  ns.tprint(` -- Downloading ${branch + '/src/' + filename}`)
  const res = await ns.wget(path + '?ts=' + new Date().getTime(), filename)
  if (!res) ns.tprint(`ERROR: Download failed: ${path}`)
}
