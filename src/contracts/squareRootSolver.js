/**
 * Square Root
 *
 * You are given a ~200 digit BigInt. Find the square root of this number, to
 * the nearest integer.
 *
 * The input is a BigInt value. The answer must be the string representing the
 * solution's BigInt value. The trailing "n" is not part of the string.
 *
 * Hint: If you are having trouble, you might consult
 * https://en.wikipedia.org/wiki/Methods_of_computing_square_roots
 *
 * Input number:
 * 90019831557767435513122200386199975874574068149007846220348315108226435074589880062424802852305997994790215553649502215952639945125184990676242381086650984321678904154798506312654134168732955973830233
 *
 * If your solution is an empty string, you must leave the text box empty. Do not use "", '', or ``.
 **/

import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  if ( typeof answer == 'string' ) {
    ns.ui.openTail()
    ns.print("ERROR: Something went wrong:")
    ns.print(answer)
    return
  }
  ns.print(answer)
  await codingContractor.sendSolution(answer.toString())
}

/**
 * @param {str} data
 */
function solve(data) {
  let bigint = BigInt(data)
  let low = 4n
  let high = bigint/low
  return findSquareRootRecursive(bigint,high,low)
}

function findSquareRootRecursive(bigint, high, low, iter =0) {
  if (iter > 100) {
    return `Iter 101, high ${high}, low ${low}, guess ${average(high, low)}`
  }

  let avg = averageBigInt(high, low)
  let square = avg * avg
  if (square == bigint)
    return avg

  if (square > bigint)
    high = avg

  if ( square < bigint )
    low = avg

  if ( high - low == 1n) {
    let highDiff = (high * high) - bigint
    let lowDiff = bigint - (low * low)
    if ( highDiff <= lowDiff)
      return high
    if (lowDiff < highDiff)
      return low
  }
  return findSquareRootRecursive(bigint, high, low, iter++)
}

/**
 * @param {BigInt} a
 * @param {BigInt} b
 * @returns {BigInt}
 */
function averageBigInt(a, b) {
  return (a + b)/2n
}
