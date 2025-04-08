/**
 * Total Ways to Sum
 *
 * It is possible to write four as a sum in exactly four different ways:
 *
 *     3 + 1
 *     2 + 2
 *     2 + 1 + 1
 *     1 + 1 + 1 + 1
 *
 * How many different ways can the number 9 be written as a sum of at least two
 * positive integers?
 *
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, file, type, server)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

function solve(num) {
  const ways = []
  ways.length = num + 1
  ways.fill(1)

  for (let i = 2; i < num; ++i) {
    for (let j = i; j <= num; ++j) {
      ways[j] += ways[j-i]
    }
  }

  return ways[num]
}
