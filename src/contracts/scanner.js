import { networkMap } from 'network.js'
import { disableLogs, tryRun } from 'helpers.js'

const solvers = {
  "Find Largest Prime Factor"           : "/contracts/failSolver.js",
  "Subarray with Maximum Sum"           : "/contracts/failSolver.js",
  "Total Ways to Sum"                   : "/contracts/failSolver.js",
  "Spiralize Matrix"                    : "/contracts/spiralizeMatrixSolver.js",
  "Array Jumping Game"                  : "/contracts/failSolver.js",
  "Merge Overlapping Intervals"         : "/contracts/failSolver.js",
  "Generate IP Addresses"               : "/contracts/failSolver.js",
  "Algorithmic Stock Trader I"          : "/contracts/failSolver.js",
  "Algorithmic Stock Trader II"         : "/contracts/failSolver.js",
  "Algorithmic Stock Trader III"        : "/contracts/failSolver.js",
  "Algorithmic Stock Trader IV"         : "/contracts/failSolver.js",
  "Minimum Path Sum in a Triangle"      : "/contracts/failSolver.js",
  "Unique Paths in a Grid I"            : "/contracts/failSolver.js",
  "Unique Paths in a Grid II"           : "/contracts/failSolver.js",
  "Sanitize Parentheses in Expression"  : "/contracts/failSolver.js",
  "Find All Valid Math Expressions"     : "/contracts/failSolver.js",
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let map = networkMap(ns)
  let contracts = findContracts(ns, map)

  for (let contract of contracts ) {
    ns.print(`Contract ${contract.file} (${contract.type)}) found on ${contract.server}`)
    await tryRun(ns, () => ns.run(solvers[contract.type], 1, '--dataString', JSON.stringify(contract)) )
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
