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

