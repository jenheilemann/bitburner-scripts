import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

/**
 * Find Largest Prime Factor
 *
 * A prime factor is a factor that is a prime number. What is the largest
 * prime factor of 339654226?
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = await fetch(ns,
    `ns.codingcontract.getData('${args.file}', '${args.server}')`,
    `/Temp/codingcontract.getData.txt`)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)

  let answer = solve(data)
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


function solve(number) {
  let factor = 2
  while (number > (factor - 1)* (factor - 1)) {
    while (number % factor === 0) {
      number = Math.round(number/factor)
    }
    ++factor
  }

  return (number === 1 ? fac-1 : number)
}

