/**
 * Merge Overlapping Intervals
 *
 * Given an array of arrays of numbers representing a list of intervals, merge
 * all overlapping intervals.
 *
 * Example:
 *
 * [[1, 3], [8, 10], [2, 6], [10, 16]]
 *
 * would merge into [[1, 6], [8, 16]].
 *
 * The intervals must be returned in ASCENDING order. You can assume that in an
 * interval, the first number will always be smaller than the second.
 *
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/** @param {array[]} pairs **/
function solve(pairs) {
  let changed = true
  let focus;
  let intervals = []

  while (pairs.length > 0) {
    changed = false
    focus = pairs.shift()
    for (let i = 0; i < pairs.length; i++) {
      if ( overlap(focus, pairs[i]) ) {
        changed = true
        focus = [Math.min(focus[0], pairs[i][0]), Math.max(focus[1], pairs[i][1])]
        pairs.splice(i, 1)
      }
    }
    if (!changed) {
      intervals.push(focus)
    } else {
      pairs.push(focus)
    }
  }
  intervals.sort((a,b) => a[0] - b[0])

  return intervals
}

/**
 * @param {any} val
 * @param {number[]} range
 **/
function overlap(val, range) {
  if ( typeof val === 'object' ) {
    return ( overlap(val[0], range) || overlap(val[1], range) || overlap(range[1], val) || overlap(range[0], val))
  }
  if ( val >= range[0] && val <= range[1] ){
    return true
  }
  return false
}
