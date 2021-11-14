/**
 * Sanitize Parentheses in Expression
 *
 * Given a string such as below:
 *
 * ()(()a
 *
 * Remove the minimum number of invalid parentheses in order to validate the
 * string. If there are multiple minimal ways to validate the string, provide
 * all of the possible results. The answer should be provided as an array
 * of strings. If it is impossible to validate the string the result should be
 * an array with only an empty string.
 *
 * IMPORTANT: The string may contain letters, not just parentheses. Examples:
 *   "()())()"   -> ["()()()", "(())()"]
 *   "(a)())()"  -> ["(a)()()", "(a())()"]
 *   ")(         -> [""]
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

function solve(str) {
  let left = 0
  let right = 0
  const res = []

  for (var i = 0; i < data.length; i++) {
    if (data[i] === "(") {
      ++left
    } else if (data[i] ===")") {
      left > 0 ? --left : ++right
    }
  }
}

function walk(pair, index, left, right, data, solution, res) {

}
