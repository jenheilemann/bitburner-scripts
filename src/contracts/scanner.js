import { networkMap } from 'network.js'

const solvers = {
  "Find Largest Prime Factor"           : "failSolver.js",
  "Subarray with Maximum Sum"           : "failSolver.js",
  "Total Ways to Sum"                   : "failSolver.js",
  "Spiralize Matrix"                    : "failSolver.js",
  "Array Jumping Game"                  : "failSolver.js",
  "Merge Overlapping Intervals"         : "failSolver.js",
  "Generate IP Addresses"               : "failSolver.js",
  "Algorithmic Stock Trader I"          : "failSolver.js",
  "Algorithmic Stock Trader II"         : "failSolver.js",
  "Algorithmic Stock Trader III"        : "failSolver.js",
  "Algorithmic Stock Trader IV"         : "failSolver.js",
  "Minimum Path Sum in a Triangle"      : "failSolver.js",
  "Unique Paths in a Grid I"            : "failSolver.js",
  "Unique Paths in a Grid II"           : "failSolver.js",
  "Sanitize Parentheses in Expression"  : "failSolver.js",
  "Find All Valid Math Expressions"     : "failSolver.js",
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let map = networkMap(ns)
  let contracts = findContracts(map)

  for (let contract of contracts ) {
    ns.tprint(`Contract ${contract.file} (${contract.type)}) found on ${contract.server}`)
  }
}

function findContracts(map) {
  let contracts = []

  for (let serverName of map ) {
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
