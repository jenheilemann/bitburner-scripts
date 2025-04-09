import { networkMapFree } from 'network.js'
import {
        disableLogs,
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

import * as primeFactorSolver from "/contracts/primeFactorSolver.js"
import * as subarrayMaximumSolver from "/contracts/subarrayMaximumSolver.js"
import * as totalWaysToSumSolver from "/contracts/totalWaysToSumSolver.js"
import * as spiralizeMatrixSolver from "/contracts/spiralizeMatrixSolver.js"
import * as arrayJumpingSolver from "/contracts/arrayJumpingSolver.js"
import * as mergeIntervalsSolver from "/contracts/mergeIntervalsSolver.js"
import * as generateIpAddsSolver from "/contracts/generateIpAddsSolver.js"
import * as stockTraderSolver from "/contracts/stockTraderSolver.js"
import * as minimumPathSumSolver from "/contracts/minimumPathSumSolver.js"
import * as uniquePaths1Solver from "/contracts/uniquePaths1Solver.js"
import * as uniquePaths2Solver from "/contracts/uniquePaths2Solver.js"
import * as sanitizeParensSolver from "/contracts/sanitizeParensSolver.js"
import * as findValidExpressionsSolver from "/contracts/findValidExpressionsSolver.js"
import * as squareRootSolver from "/contracts/squareRootSolver.js"

const solvers = {
  "Find Largest Prime Factor"           : primeFactorSolver,
  "Subarray with Maximum Sum"           : subarrayMaximumSolver,
  "Total Ways to Sum"                   : totalWaysToSumSolver,
  "Spiralize Matrix"                    : spiralizeMatrixSolver,
  "Array Jumping Game"                  : arrayJumpingSolver,
  "Merge Overlapping Intervals"         : mergeIntervalsSolver,
  "Generate IP Addresses"               : generateIpAddsSolver,
  "Algorithmic Stock Trader I"          : stockTraderSolver,
  "Algorithmic Stock Trader II"         : stockTraderSolver,
  "Algorithmic Stock Trader III"        : stockTraderSolver,
  "Algorithmic Stock Trader IV"         : stockTraderSolver,
  "Minimum Path Sum in a Triangle"      : minimumPathSumSolver,
  "Unique Paths in a Grid I"            : uniquePaths1Solver,
  "Unique Paths in a Grid II"           : uniquePaths2Solver,
  "Sanitize Parentheses in Expression"  : sanitizeParensSolver,
  "Find All Valid Math Expressions"     : findValidExpressionsSolver,
  "Square Root"                         : squareRootSolver,
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let map = await networkMapFree()
  if (map['home'].maxRam < 32){
    ns.print('Not enough ram to read contracts, try later.')
    return
  }
  ns.clearLog()

  await runContracts(ns, map)
}

/**
 * @param {NS} ns
 * @param {Obj} map
 **/
async function runContracts(ns, map) {
  let solverFile
  const servers = Object.values(map)
  let contracts = servers.map(
    s => s.files.filter(f => f.includes('.cct')).map(f =>
    { return {name: f, server: s.hostname, type: '', }})).flat()
  for (let file of contracts ) {
    let cmd = `ns.codingcontract.getContractType('${file.name}','${file.server}')`
    file.type = await fetch(ns, cmd, "/Temp/codingContract.getContractType.txt")
  }
  ns.print(contracts)
  // let contract = contracts[0]

  for ( const contract of contracts ) {
    // Contract needs to be in the format
    // { file: 'name', type: 'type', server: 'server'}
    ns.print(`Contract ${contract.name} (${contract.type}) found on ${contract.server}`)
    // solverFile = solvers[contract.type] ?? "/contracts/failSolver.js"
    solverFile = solvers[contract.type] ?? "fail"
    if (typeof solverFile == "string") {
      continue
    }
    // ns.spawn(solverFile, {spawnDelay:0}, '--dataString', JSON.stringify(contract))
    await solverFile.main(ns, contract.name, contract.type, contract.server)
    return
  }
}
