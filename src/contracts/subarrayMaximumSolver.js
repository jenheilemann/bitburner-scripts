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
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = ns.codingcontract.getData(args.file, args.server)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  let answer = solve(data)
  ns.tprint(`My answer: ${answer}`)
  let result = ns.codingcontract.attempt(
    answer,
    args.file,
    args.server,
    { returnReward: true }
  )
  ns.tprint(`${args.file} attempt result: ${result}`)
  if ( result === '' ) {
    ns.tprint(`**************** Failure detected! ********************`)
    ns.tprint(JSON.stringify(args))
    ns.tprint(data)
    ns.kill('/contracts/scanner.js', 'home')
  }
}

function solve(numbers) {
  for (var i = 1; i < numbers.length; i++) {
    numbers[i] = Math.max(numbers[i], numbers[i] + numbers[i-1])
  }

  return Math.max(...numbers)
}

