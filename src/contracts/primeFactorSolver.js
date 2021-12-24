/**
 * Find Largest Prime Factor
 *
 * A prime factor is a factor that is a prime number. What is the largest
 * prime factor of 339654226?
 *
 **/
import { CodingContractWrapper } from '/contracts/CodingContractWrapper.js'

/** @param {NS} ns **/
export async function main(ns) {
  const codingContractor = new CodingContractWrapper(ns)
  const answer = solve(await codingContractor.extractData())
  await codingContractor.sendSolution(answer)
}

function solve(number) {
  let factor = 2
  while (number > (factor - 1)* (factor - 1)) {
    while (number % factor === 0) {
      number = Math.round(number/factor)
    }
    ++factor
  }

  return (number === 1 ? fac-1 : number)
}

