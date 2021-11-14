import { networkMap } from 'network.js'
import { disableLogs, tryRun } from 'helpers.js'

const solvers = {
  "Find Largest Prime Factor"           : "/contracts/primeFactorSolver.js",
  "Subarray with Maximum Sum"           : "/contracts/subarrayMaximumSolver.js",
  "Total Ways to Sum"                   : "/contracts/failSolver.js",
  "Spiralize Matrix"                    : "/contracts/spiralizeMatrixSolver.js",
  "Array Jumping Game"                  : "/contracts/arrayJumpingSolver.js",
  "Merge Overlapping Intervals"         : "/contracts/mergeIntervalsSolver.js",
  "Generate IP Addresses"               : "/contracts/generateIpAddsSolver.js",
  "Algorithmic Stock Trader I"          : "/contracts/stockTraderSolver.js",
  "Algorithmic Stock Trader II"         : "/contracts/stockTraderSolver.js",
  "Algorithmic Stock Trader III"        : "/contracts/stockTraderSolver.js",
  "Algorithmic Stock Trader IV"         : "/contracts/stockTraderSolver.js",
  "Minimum Path Sum in a Triangle"      : "/contracts/minimumPathSumSolver.js",
  "Unique Paths in a Grid I"            : "/contracts/uniquePaths1Solver.js",
  "Unique Paths in a Grid II"           : "/contracts/uniquePaths2Solver.js",
  "Sanitize Parentheses in Expression"  : "/contracts/failSolver.js",
  "Find All Valid Math Expressions"     : "/contracts/findValidExpressionsSolver.js",
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let map = await networkMap(ns)
  let contracts;

  while ( true ) {
    contracts = findContracts(ns, map)

    for (let contract of contracts ) {
      ns.print(`Contract ${contract.file} (${contract.type}) found on ${contract.server}`)
      await tryRun(ns, () => ns.run(solvers[contract.type], 1, '--dataString', JSON.stringify(contract)) )
      await ns.sleep(30)
    }
    await ns.sleep(10 * 60 * 1000)
  }
}

function findContracts(ns, map) {
  let contracts = []

  for (let serverName in map ) {
    for ( let file of ns.ls(serverName, '.cct') ) {
      contracts.push({
        file: file,
        server: serverName,
        type: ns.codingcontract.getContractType(file, serverName),
      })
    }
  }
  return contracts;
}
