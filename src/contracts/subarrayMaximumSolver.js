/**
 * Subarray with Maximum Sum
 *
 * Given an array of integers, find the contiguous subarray (containing at
 * least one number) which has the largest sum and return that sum.
 *
 * 'Sum' referst to the sum of all the numbers in the subarray.
 *
 * Example:
 *
 * [3,2,0,-3,-5,4]
 *
 * Answer: 5 (the sum of [3,2])
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

function solve(numbers) {
  for (var i = 1; i < numbers.length; i++) {
    numbers[i] = Math.max(numbers[i], numbers[i] + numbers[i-1])
  }

  return Math.max(...numbers)
}

