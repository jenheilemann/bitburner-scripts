
const valuesToRemove = ['jh_network_map']
const filesToDownload = [
  '/contracts/arrayJumpingSolver.js',
  '/contracts/failSolver.js',
  '/contracts/findValidExpressionsSolver.js',
  '/contracts/generateIpAddsSolver.js',
  '/contracts/mergeIntervalsSolver.js',
  '/contracts/minimumPathSumSolver.js',
  '/contracts/primeFactorSolver.js',
  '/contracts/sanitizeParensSolver.js',
  '/contracts/scanner.js',
  '/contracts/spiralizeMatrixSolver.js',
  '/contracts/stockTraderSolver.js',
  '/contracts/subarrayMaximumSolver.js',
  '/contracts/totalWaysToSumSolver.js',
  '/contracts/uniquePaths1Solver.js',
  '/contracts/uniquePaths2Solver.js',
  '/hacknet/coreUpgrader.js',
  '/hacknet/levelUpgrader.js',
  '/hacknet/ramUpgrader.js',
  '/hacknet/startup.js',
  '/satellites/backdoorObserver.js',
  '/satellites/controller.js',
  '/satellites/playerObserver.js',
  '/satellites/programBuyer.js',
  '/satellites/programObserver.js',
  '/satellites/serversObserver.js',
  '/satellites/torBuyer.js',
  'analyze-hack.js',
  'backdoor.js',
  'bestHack.js',
  'botnet.js',
  'breadwinner.js',
  'buyer.js',
  'constants.js',
  'crime.js',
  'find.js',
  'groupBy.js',
  'helpers.js',
  'network.js',
  'networkMapper.js',
  'rooter.js',
  'whisperer.js',
  'zombifier.js',
]
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/master/src'

export async function download(ns, filename) {
  const fileUrl = filename.includes("/") ? filename : "/" + filename;
  const path = baseUrl + fileUrl
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}

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
  ns.tprint('Killed and deleted old scripts.')
  ns.tprint(`Files downloaded.`)

  valuesToRemove.map((value) => localStorage.removeItem(value))
  ns.tprint(`Cleaned up localStorage.`)

  ns.tprint(`Starting hacknet/startup.js`)
  ns.run('/hacknet/startup.js', 1)
  ns.tprint(`Starting buyer.js`)
  ns.run('buyer.js', 1)
  ns.tprint(`Starting botnet.js`)
  ns.run('botnet.js', 1)
  ns.tprint(`Starting contracts/scanner.js`)
  ns.run('/contracts/scanner.js', 1)
  ns.tprint(`Startup script completed. May your pillow always be cool.`)
}
