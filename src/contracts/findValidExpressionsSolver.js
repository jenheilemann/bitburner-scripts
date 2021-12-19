import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

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
  let data = await fetch(ns,
    `ns.codingcontract.getData('${args.file}', '${args.server}')`
    `/Temp/codingcontract.getData.txt`)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  let answer = solve(data[0], data[1])
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
    ns.tprint(answer)
  }
}

function solve(digits, target) {
  let walker = new Walker(digits, target)
  walker.walk()
  return walker.result
}

class Walker {
  constructor(digits, target) {
    this.digits = digits
    this.target = target
    this.result = []
  }

  walk(path="", position=0, value=0, prevTerm=0) {
    if ( position === this.digits.length ) {
      if (this.target === value) {
        this.result.push(path)
      }
      return
    }

    for ( let i = position; i < this.digits.length; ++i ) {
      if (i != position && this.digits[position] == '0') {
        break
      }
      const current = parseInt(this.digits.substring(position, i + 1))

      if ( position == 0 ) {
        this.walk(`${path}${current}`, i+1, current, current)
      } else {
        this.walk(`${path}+${current}`, i+1, value + current, current)
        this.walk(`${path}-${current}`, i+1, value - current, -current)
        this.walk(`${path}*${current}`, i+1, value - prevTerm + prevTerm*current, prevTerm*current)
      }
    }
  }
}
