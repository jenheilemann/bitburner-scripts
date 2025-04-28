/** Example usage:

export async function main(ns, file, type, server) {
  const codingContractor = new CodingContractWrapper(ns, {file: filename})
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
} from 'utils/helpers.js'

export class CodingContractWrapper {
  /** @param {NS} ns **/
  constructor(ns, file, type, server) {
    this.ns = ns
    this.file = file
    this.type = type
    this.server = server
    ns.tprint(`Found ${this.file} (${this.type}) on ${this.server}`)
  }

  // Get the coding contract puzzle data
  async extractData() {
    let cmd = `ns.codingcontract.getData('${this.file}', '${this.server}')`
    this.data = await fetch(this.ns, cmd, `/Temp/codingcontract.getData.txt`)
    return this.data
  }

  // attempt to send the solution for the coding contract
  async sendSolution(solution) {
    const result = await fetch(this.ns, `ns.codingcontract.attempt(
      ${JSON.stringify(solution)},
      '${this.file}',
      '${this.server}',
      { returnReward: true })`,
    '/Temp/codingContract.attempt.txt')
    const msg = `${this.file} attempt result: ${result}`
    announce(this.ns, msg)

    if ( result === '' ) {
      this.ns.tprint(`**************** Failure detected! ********************`)
      this.ns.tprint(JSON.stringify({ file: this.file, type: this.type, server: this.server }))
      this.ns.tprint(JSON.stringify(this.data))
      this.ns.tprint(solution)
    }
  }
}
