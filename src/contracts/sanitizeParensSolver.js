import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

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
  let result = await fetch(ns, `ns.codingcontract.attempt(
    '${JSON.stringify(answer)}',
    '${args.file}',
    '${args.server}',
    { returnReward: true }
  )`)
  ns.tprint(`${args.file} attempt result: ${result}`)
  if ( result === '' ) {
    ns.tprint(`**************** Failure detected! ********************`)
    ns.tprint(JSON.stringify(args))
    ns.tprint(data)
  }
}

function solve(str) {
  let walker = new Walker(str)
  let [left, right] = walker.calcLeftRight()
  walker.walk(left, right)
  return walker.solutions
}

class Walker {
  constructor(str) {
    this.str = str
    this.solutions = []
  }

  calcLeftRight() {
    let left = 0
    let right = 0

    for (var i = 0; i < this.str.length; i++) {
      if (this.str[i] === "(") {
        ++left
      } else if (this.str[i] ===")") {
        left > 0 ? --left : ++right
      }
    }
    return [left, right]
  }

  walk(left, right, pair = 0, index = 0, solutionCandidate = "") {
    if ( this.str.length === index ) {
      if (left === 0 && right === 0 && pair == 0) {
        if (this.solutions.indexOf(solutionCandidate) > -1) {
          return
        }
        this.solutions.push(solutionCandidate)
      }
      return
    }

    if (this.str[index] === "(") {
      if ( left > 0 ) {
        this.walk(left-1, right, pair, index+1, solutionCandidate)
      }
      this.walk(left, right, pair+1, index+1, solutionCandidate+this.str[index])
    } else if (this.str[index] === ")") {
      if (right > 0)
        this.walk(left, right-1, pair, index+1, solutionCandidate)
      if (pair > 0)
        this.walk(left, right, pair-1, index+1, solutionCandidate+this.str[index])
    } else {
      this.walk(left, right, pair, index+1, solutionCandidate+this.str[index])
    }
  }
}

