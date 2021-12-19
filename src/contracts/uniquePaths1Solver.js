import { solve } from '/contracts/uniquePaths2Solver.js'
import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'


/**
 * Unique Paths in a Grid I
 *
 * You are in a grid with 14 rows and 13 columns, and you are positioned in the
 * top-left corner of that grid. You are trying to reach the bottom-right
 * corner of the grid, but you can only move down or right on each step.
 * Determine how many unique paths there are from start to finish.
 *
 * NOTE: The data returned for this contract is an array with the number of
 * rows and columns:
 *
 * [14, 13]
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = await fetch(ns,
    `ns.codingcontract.getData('${args.file}', '${args.server}')`
    `/Temp/codingcontract.getData.txt`)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  let answer = solve(expand(data[0], data[1]))
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

function expand(height, width) {
  return Array(height).fill(Array(width).fill(0))
}
