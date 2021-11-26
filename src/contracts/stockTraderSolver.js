import {
        getNsDataThroughFile as fetch,
      } from 'helpers.js'

/**
 * Algorithmic Stock Trader IV
 *
 * You are given an array with two elements:
 *
 * [7, [106,42,117,140,162,101,135,181,110,9]]
 *
 * The first element is an integer k. The second element is an array of stock
 * prices (which are numbers) where the i-th element represents the stock price
 * on day i.
 *
 * Determine the maximum possible profit you can earn using at most k
 * transactions. A transaction is defined as buying and then selling one share
 * of the stock. Note that you cannot engage in multiple transactions at once.
 * In other words, you must sell the stock before you can buy it again.
 *
 * If no profit can be made, then the answer should be 0.
 *
 * @param {NS} ns
 **/
export async function main(ns) {
  let args = JSON.parse(ns.flags([['dataString', '']]).dataString)
  let data = ns.codingcontract.getData(args.file, args.server)

  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}`)

  let solveArgs = solveArgsByType(args.type, data)
  let answer = solve(...solveArgs)
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

function solveArgsByType(type, data) {
  switch (type) {
    case "Algorithmic Stock Trader I" :
      return [1, data]
    case "Algorithmic Stock Trader II" :
      return [data.length, data]
    case "Algorithmic Stock Trader III" :
      return [2, data]
    case "Algorithmic Stock Trader IV" :
      return [data[0], data[1]]
  }
}

export function solve(transactions, prices) {
  const length = prices.length

  if ( length < 2 ) {
    return 0
  }

  if (transactions > length/2) {
    let result = 0
    for (let i = 1; i < length; ++i) {
      result += Math.max(prices[i]-prices[i-1], 0)
    }
    return result
  }

  const rele = Array(transactions + 1).fill(0)
  const hold = Array(transactions + 1).fill(Number.MIN_SAFE_INTEGER)
  let current;

  for (let i = 0; i < length; ++i) {
    current = prices[i]
    for (let j = transactions; j > 0; --j) {
      rele[j] = Math.max(rele[j], hold[j] + current)
      hold[j] = Math.max(hold[j], rele[j - 1] - current)
    }
  }

  return rele[transactions]
}
