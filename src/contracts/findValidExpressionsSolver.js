/**
 * Find All Valid Math Expressions
 *
 * You are given a string which contains only digits between 0 and 9:
 *
 * 27275
 *
 * You are also given a target number. Return all possible ways you can add
 * the +, -, and * operators to the string such that it evaluates to the target
 * number.
 *
 * The provided answer should be an array of strings containing the valid
 * expressions. The data provided by this problem is an array with two
 * elements. The first element is the string of digits, while the second
 * element is the target number:
 *
 * ["27275", 62]
 *
 * NOTE: Numbers in the expression cannot have leading 0's. In other words,
 * "1+01" is not a valid expression
 *
 * Examples:
 *
 * Input: digits = "123", target = 6
 * Output: ["1+2+3", "1*2*3"]
 *
 * Input: digits = "105", target = 5
 * Output: ["1*0+5", "10-5"]
 *
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = ns.codingcontract.getData(args.file, args.server)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  ns.tprint(args)
  ns.tprint(data)

  // let answer = solve(data)
  // ns.tprint(`My answer: ${answer}`)
  // let result = ns.codingcontract.attempt('', args.file, args.server, { returnReward: true })
  // ns.tprint(`${args.file} attempt result: ${result}`)
}
