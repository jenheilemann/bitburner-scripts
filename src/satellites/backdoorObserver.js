import { getLSItem, tryRun, canUseSingularity } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { specialServers } from 'utils/constants.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const nmap = networkMapFree()
  const player = getLSItem('PLAYER')

  // shuffle the array semi-randomly so there are less collisions
  let server = findServer(Object.values(nmap).sort(() => .5 - Math.random()),
                          player.skills.hacking,
                          Object.keys(specialServers))

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
    await tryRun(() => { ns.spawn('usr/find.js', {spawnDelay:0}, server.hostname, true) })
  }
}

function isBackdoorOf(process, hostname) {
  return process.filename == 'backdoor.js' && process.args.includes(hostname)
}

function findServer(servers, playerHacking, preferred) {
  let server = servers.find(s =>
    preferred.includes(s.hostname) &&
    serverIsBackdoorable(s, playerHacking)
  )
  if (server)
    return server
  if (!canUseSingularity())
    return

  return servers.find(s => serverIsBackdoorable(s, playerHacking))
}

function serverIsBackdoorable(server, playerHacking) {
  return !server.backdoorInstalled &&
    !server.purchasedByPlayer &&
    playerHacking >= server.requiredHackingSkill &&
    server.hasAdminRights
}
