/**
 * Unique Paths in a Grid I
 *
 * You are in a grid with 14 rows and 13 columns, and you are positioned in the
 * top-left corner of that grid. You are trying to reach the bottom-right
 * corner of the grid, but you can only move down or right on each step.
 * Determine how many unique paths there are from start to finish.
 *
 * NOTE: The data returned for this contract is an array with the number of
 * rows and columns:
 *
 * [14, 13]
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'
import { solve } from '/contracts/uniquePaths2Solver.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const data = await codingContractor.extractData()
  const answer = solve(expand(data[0], data[1]))
  await codingContractor.sendSolution(answer)
}

function expand(height, width) {
  return Array(height).fill(Array(width).fill(0))
}
