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
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = ns.codingcontract.getData(args.file, args.server)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  let answer = solve(data)
  let result = ns.codingcontract.attempt(
    answer,
    args.file,
    args.server,
    { returnReward: true })
  ns.tprint(`${args.file} attempt result: ${result}`)
  if ( result === '' ) {
    ns.tprint(`**************** Failure detected! ********************`)
    ns.tprint(JSON.stringify(args))
    ns.tprint(data)
    ns.kill('/contracts/scanner.js', 'home')
  }
}

function solve(pyramid) {
  pyramid.forEach((row, level) => {
    if ( level == 0 ) {
      // the top level is its own sum, doesn't need to change
      return
    }
    row.forEach((node, position) => row[position] = node + fetchCheapestPath(pyramid, level, position))
  })

  return Math.min(...pyramid.pop())
}

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
