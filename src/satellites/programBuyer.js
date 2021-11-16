import { getLSItem } from 'helpers.js'
import { purchaseables } from 'constants.js'
import { networkMap } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const player = getLSItem('PLAYER')
  const program = purchaseables.find(p => p.name === ns.args[0])
  if ( program === undefined || !player.tor || player.money < program.cost) {
    ns.tail()
    ns.print('Program buyer quit unexpectedly')
    ns.print('Program: ', program)
    ns.print('player.tor: ', player.tor)
    ns.print('player.money ', ns.nFormat(player.money, "$0.000a"),
      ' program.cost ', ns.nFormat(program.cost, "$0.000a" ),
      player.money >= program.cost)
    return
  }

  ns.purchaseProgram(program.name)
}
