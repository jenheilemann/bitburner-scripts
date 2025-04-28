import { fetchPlayer } from 'utils/helpers.js'
import { factionServers } from 'constants.js'
const autoAccept = Object.values(factionServers)

/** @param {NS} ns **/
export async function main(ns) {
  const player = fetchPlayer()
  const canJoin = autoAccept.filter(f => !player.factions.includes(f))
  canJoin.forEach(f => {
    let joined = ns.joinFaction(f)
    if ( joined ) { ns.tprint(`********* Joined ${f} **********`) }
  })
}
