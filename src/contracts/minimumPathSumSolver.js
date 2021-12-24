/**
 * Minimum Path Sum in a Triangle
 *
 * Given a triangle, find the minimum path sum from top to bottom. In each step
 * of the path, you may only move to adjacent numbers in the row below.
 *
 * The triangle is represented as a 2D array of numbers:
 *
      [[3],
      [2,5],
     [6,2,0],
    [8,7,5,2]]
 *
 * Example: If you are given the following triangle:
 *
       [[2],
       [3,4],
      [6,5,7],
     [4,1,8,3]]
 *
 * The minimum path sum is 11 (2 -> 3 -> 5 -> 1).
 *
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns) {
  const codingContractor = new CodingContractWrapper(ns)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

/**
 * @param {array[]} data
 */
function solve(data) {
  const pyramid = data.slice()
  pyramid.forEach((row, level) => {
    if ( level == 0 ) {
      // the top level is its own sum, doesn't need to change
      return
    }
    row.forEach((node, position) => row[position] = node + fetchCheapestPath(pyramid, level, position))
  })

  return Math.min(...pyramid.pop())
}

/**
 * @param {array[]} pyramid - the whole pyramid array of arrays
 * @param {number} level    - the height/row/subarray being evaluated
 * @param {number} position - the specific location being evaluated
 */
function fetchCheapestPath(pyramid, level, position) {
  let higher = pyramid[level-1]
  if ( position == 0 )
    return higher[0]
  if ( position == higher.length )
    return higher[position-1]

  let left = higher[position-1]
  let right = higher[position]
  return Math.min(left, right)
}
