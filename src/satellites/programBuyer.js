import {
        getNsDataThroughFile as fetch,
        runCommand,
        fetchPlayer,
        } from 'helpers.js'
import { purchaseables } from 'constants.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const player = fetchPlayer()
  const program = purchaseables.find(p => p.name === ns.args[0])
  if ( program === undefined || !player.tor || player.money < program.cost) {
    ns.tail()
    ns.print('Program buyer quit unexpectedly')
    ns.print('Program: ', program)
    ns.print('player.tor: ', player.tor)
    ns.print('player.money: ', ns.nFormat(player.money, "$0.000a")," > ",
      ' program.cost ', ns.nFormat(program.cost, "$0.000a" ), " ? ",
      player.money >= program.cost)
    return
  }

  ns.tprint(`Buying ${program.name} for ${ns.nFormat(program.cost, "$0.000a" )}`)
  let result = await fetch(ns, `ns.purchaseProgram('${program.name}')`)
  if ( result ) {
    ns.tprint(`SUCCESS: ${program.name} purchased.`)
    return
  }
  ns.tprint(`FAILURE: Purchasing ${program.name} was unsuccessfull. Trying again soon.`)
}
