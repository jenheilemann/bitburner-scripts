/** Example usage:

export async function main(ns) {
  const codingContractor = new CodingContractWrapper(ns)
  const answer = solve(await codingContractor.extractData())
  codingContractor.sendSolution(answer)
}

function solve(data) {
  solve the puzzle here!
  return solution
}

**/

import {
  getNsDataThroughFile as fetch,
  announce,
} from 'helpers.js'

export class CodingContractWrapper {
  /** @param {NS} ns **/
  constructor(ns) {
    this.ns = ns
    this.args = JSON.parse(this.ns.flags([['dataString', '']]).dataString)
    ns.tprint(`Found ${this.args.file} (${this.args.type}) on ${this.args.server}`)
  }

  // Get the coding contract puzzle data
  async extractData() {
    let cmd = `ns.codingcontract.getData('${this.args.file}', '${this.args.server}')`
    this.data = await fetch(this.ns, cmd, `/Temp/codingcontract.getData.txt`)
    return this.data
  }

  // attempt to send the solution for the coding contract
  async sendSolution(solution) {
    const result = await fetch(this.ns, `ns.codingcontract.attempt(
      ${JSON.stringify(solution)},
      '${this.args.file}',
      '${this.args.server}',
      { returnReward: true })`,
    '/Temp/codingContract.attempt.txt')
    const msg = `${this.args.file} attempt result: ${result}`
    this.ns.tprint(msg)
    announce(this.ns, msg)

    if ( result === '' ) {
      this.ns.tprint(`**************** Failure detected! ********************`)
      this.ns.tprint(JSON.stringify(this.args))
      this.ns.tprint(JSON.stringify(this.data))
      this.ns.tprint(solution)
    }
  }
}
