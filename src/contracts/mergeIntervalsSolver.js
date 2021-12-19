import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

/**
 * Merge Overlapping Intervals
 *
 * Given an array of arrays of numbers representing a list of intervals, merge
 * all overlapping intervals.
 *
 * Example:
 *
 * [[1, 3], [8, 10], [2, 6], [10, 16]]
 *
 * would merge into [[1, 6], [8, 16]].
 *
 * The intervals must be returned in ASCENDING order. You can assume that in an
 * interval, the first number will always be smaller than the second.
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = await fetch(ns,
    `ns.codingcontract.getData('${args.file}', '${args.server}')`,
    `/Temp/codingcontract.getData.txt`)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)
  let answer = solve(data.slice())
  let result = await fetch(ns, `ns.codingcontract.attempt(
    ${JSON.stringify(answer)},
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


function solve(pairs) {
  let changed = true
  let focus;
  let intervals = []

  while (pairs.length > 0) {
    changed = false
    focus = pairs.shift()
    for (let i = 0; i < pairs.length; i++) {
      if ( overlap(focus, pairs[i]) ) {
        changed = true
        focus = [Math.min(focus[0], pairs[i][0]), Math.max(focus[1], pairs[i][1])]
        pairs.splice(i, 1)
      }
    }
    if (!changed) {
      intervals.push(focus)
    } else {
      pairs.push(focus)
    }
  }
  intervals.sort((a,b) => a[0] - b[0])

  return intervals
}

function overlap(val, range) {
  if ( typeof val === 'object' ) {
    return ( overlap(val[0], range) || overlap(val[1], range) || overlap(range[1], val) || overlap(range[0], val))
  }
  if ( val >= range[0] && val <= range[1] ){
    return true
  }
  return false
}
