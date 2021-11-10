/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  // let data = ns.codingcontract.getData(args.file, args.server)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)

  // let answer = solve(data)
  // ns.tprint(`My answer: ${answer}`)
  // let result = ns.codingcontract.attempt('', args.file, args.server, { returnReward: true })
  // ns.tprint(`${args.file} attempt result: ${result}`)
}
