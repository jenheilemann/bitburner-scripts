import { getLSItem, tryRun, canUseSingularity } from 'helpers.js'
import { networkMapFree } from 'network.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const nmap = networkMapFree()
  const player = getLSItem('PLAYER')

  // shuffle the array semi-randomly so there are less collisions
  let server = Object.values(nmap).sort(() => .5 - Math.random()).find(s =>
    !s.backdoorInstalled &&
    !s.purchasedByPlayer &&
    player.skills.hacking >= s.requiredHackingSkill &&
    s.hasAdminRights
  )
  if (!server) {
    ns.print('No server found!')
    return
  }

  if (canUseSingularity()) {
    if ( ns.ps('home').some(proc => isBackdoorOf(proc, server.hostname)) ) {
      ns.print("Backdoor already running on this server.")
      return
    }
    ns.tprint('Attempting automatic backdoor of ' + server.hostname)
    await tryRun(() => { ns.spawn('backdoor.js', {spawnDelay:0}, server.hostname) })
  } else {
    ns.tprint('Backdoor of ' + server.hostname + " available, finding path.")
    await tryRun(() => { ns.spawn('find.js', {spawnDelay:0}, server.hostname, true) })
  }
}

function isBackdoorOf(process, hostname) {
  return process.filename == 'backdoor.js' && process.args.includes(hostname)
}
