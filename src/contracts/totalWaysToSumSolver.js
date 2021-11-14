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
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = ns.codingcontract.getData(args.file, args.server)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  ns.tprint(data)
  let answer = solve(data[0], data[1])
  ns.tprint(`My answer: ${answer}`)
  let result = ns.codingcontract.attempt('', args.file, args.server, { returnReward: true })
  ns.tprint(`${args.file} attempt result: ${result}`)
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
