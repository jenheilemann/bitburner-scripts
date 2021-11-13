/**
 * Array Jumping Game
 *
 * You are given the following array of integers:
 *
 * 7,10,5,8,0,0,7,0,4,0,2,2,6,7
 *
 * Each element in the array represents your MAXIMUM jump length at that
 * position. This means that if you are at position i and your maximum jump
 * length is n, you can jump to any position from i to i+n.
 *
 * Assuming you are initially positioned at the start of the array, determine
 * whether you are able to reach the last index exactly.
 *
 * Your answer should be submitted as 1 or 0, representing true and false
 * respectively
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
}


function solve(arr) {
  let farthest = arr[0]

  for (i = 0; i <= farthest; i++) {
    console.log("farthest: ", farthest, "arr[i] ", arr[i], "i+arr[i]", i + arr[i])
    farthest = Math.max(farthest, i+arr[i])
    if ( farthest >= arr.length-1 ) { return 1 }
  }

  return 0
}
