import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

/**
 * Spiralize Matrix
 *
 * Given an array of arrays of numbers representing a 2D matrix,
 * return the elements of the matrix as an array in spiral order.
 *
 * Here is an example of what spiral order should be:
 *  [
 *      [1, 2, 3]
 *      [4, 5, 6]
 *      [7, 8, 9]
 *  ]
 *  Answer: [1, 2, 3, 6, 9, 8 ,7, 4, 5]
 *
 * Note that the matrix will not always be square.
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = await fetch(ns, `ns.codingcontract.getData('${args.file}', '${args.server}')` )

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  let answer = solve(data.slice())
  let result = await fetch(ns, `ns.codingcontract.attempt(
    ${answer},
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


/**
 * @param {array []} matrix
 **/
function solve(matrix) {
  let answer = []

  while ( matrix.length > 0 ) {
    // Add the top array, and remove it from the matrix
    answer.push( ...matrix.shift() )
    // add the last element of each array
    matrix.forEach((arr) => answer.push(arr.pop()))
    // check if it's an odd number of rows, we might be done now
    if ( matrix.length == 0 ) { return answer.flat().filter(v => v != null) }
    // add the bottom array, reversed
    answer.push( ...matrix.pop().reverse() )
    // add the first element of each array, reversed (bottom to top)
    answer.push( ...matrix.map(arr => arr.shift()).reverse() )
  }

  return answer.flat().filter(v => v != null)
}
