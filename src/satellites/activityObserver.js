import { toolsCount,
  announce,
  getLSItem,
  fetchPlayer,
  getNsDataThroughFile as fetch,
  } from 'utils/helpers.js'
import { earnFactionInvite } from 'workForFactions.js'
const sec = 1000, min = 60*sec, hour = 60*min

/** @param {NS} ns **/
export async function main(ns) {
  const processes = ns.ps('home')
  const crimePS   = processes.find(p => p.filename === 'crime.js')
  const factionPS = processes.find(p => p.filename === 'workForFactions.js')

  // if I set the working key within the last hour, don't do anything
  if ( getLSItem('working') > Date.now() - hour ) {
    ns.print('currently working, killing processes and skipping.')
    if (crimePS) ns.kill(crimePS.pid, 'home')
    if (factionPS) ns.kill(factionPS.pid, 'home')
    return
  }

  const inAGang = await inAnyGang(ns)
  if ( !inAGang && canJoinGang(ns) ) {
    ns.print(`inAGang: ${inAGang}, canJoin: ${canJoinGang(ns)}`)
    ns.print('trying to join a gang')
    return await joinGang(ns)
  }

  if ( !inAGang && !canJoinGang(ns) ) {
    ns.print(`inAGang: ${inAGang}, canJoin: ${canJoinGang(ns)}`)
    return runGetKarma(ns, crimePS)
  }

  if ( toolsCount() >= 5 ) {
    if ( crimePS ) {
      announce(ns, 'Switching from crime to grinding faction rep')
      ns.kill(crimePS.pid, 'home')
    }
    if ( !factionPS ) {
      announce(ns, 'Starting work for factions...')
      ns.run('workForFactions.js')
    }
    return
  }

  if ( !crimePS ) {
    ns.run('crime.js', 1, '--fastCrimes')
  }
}

function runGetKarma(ns, crimePS) {
  if (!crimePS) {
    announce(ns, 'Reducing my karma for starting a gang')
    ns.run('crime.js', 1, '--focus', 'karma')
  }
}

/** @param {NS} ns */
async function joinGang(ns) {
  announce(ns, "Attempting to start Slum Snakes gang...")
  await earnFactionInvite(ns, 'Slum Snakes')
  let res = await fetch(ns, `ns.gang.createGang('Slum Snakes')`, '/Temp/gang.createGang.txt')
  if ( res )
    return ns.print('SUCCESS: formed gang in Slum Snakes')
  ns.print('ERROR: attempted to form Slum Snakes gang, not successfull.')
}

async function inAnyGang(ns) {
  return await fetch(ns, `ns.gang.inGang()`, '/Temp/inGang.txt')
}

function canJoinGang(ns) {
  const player = fetchPlayer()
  if ( player.resetInfo.currentNode == 2 )
    return true

  ns.print(`Current karma (${player.karma}) (${player.karma < -54000})`)
  return ( player.karma < -54000 )
}
