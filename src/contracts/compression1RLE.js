/**
 * Compression I: RLE Compression
 *
 * You are attempting to solve a Coding Contract. You have 10 tries remaining,
 * after which the contract will self-destruct.
 *
 * Run-length encoding (RLE) is a data compression technique which encodes data
 * as a series of runs of a repeated single character. Runs are encoded as a
 * length, followed by the character itself. Lengths are encoded as a single
 * ASCII digit; runs of 10 characters or more are encoded by splitting them
 * into multiple runs.
 *
 * You are given the following input string:
 *  sFFFFFFFFGerk0y3q00BBBBBBBBBBaaaaaaaaa4SSg62266QffffffffT111111111zllllllllllRR
 * Encode it using run-length encoding with the minimum possible output
 * length.
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const testVal1 = 'aaaaabccc'
  if (solve(testVal1) !== '5a1b3c') {
    ns.print("ERROR: 'aaaaabccc' should solve to '5a1b3c'.")
    ns.print(`ERROR: 'aaaaabccc' solves to '${solve(testVal1)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 1 passed. ")
  const testVal2 = 'aAaAaA'
  if (solve(testVal2) !== '1a1A1a1A1a1A') {
    ns.print("ERROR: 'aAaAaA' should solve to '1a1A1a1A1a1A'.")
    ns.print(`ERROR: 'aAaAaA' solves to '${solve(testVal2)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 2 passed. ")
  const testVal3 = '111112333'
  if (solve(testVal3) !== '511233') {
    ns.print("ERROR: '111112333' should solve to '511233'.")
    ns.print(`ERROR: '111112333' solves to '${solve(testVal3)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 3 passed. ")
  const testVal4 = 'zzzzzzzzzzzzzzzzzzz'
  if (solve(testVal4) !== '9z9z1z') {
    ns.print("ERROR: 'zzzzzzzzzzzzzzzzzzz' should solve to '9z9z1z'.")
    ns.print(`ERROR: 'zzzzzzzzzzzzzzzzzzz' solves to '${solve(testVal4)}'.`)
    ns.exit()
  }
  ns.print("SUCCESS: Test 4 passed. ")
  ns.print("SUCCESS: All tests passed.")

  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/**
 * @param {string} data
 */
function solve(data) {
  const regex = /(.)\1*/g
  const matches = data.matchAll(regex)

  let res = ""
  for (const match of matches) {
    res += processSubstring(match[0])
  }

  return res
}

/**
 * @param {string} substr
 */
function processSubstring(substr) {
  const remainder = substr.length % 9
  const divisor = Math.floor(substr.length / 9)
  let res = ""
  if (divisor > 0 )
    res += `9${substr[0]}`.repeat(divisor)
  if ( remainder > 0 )
    res += remainder + substr[0]
  return res
}
