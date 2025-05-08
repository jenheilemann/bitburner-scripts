import { getLSItem, tryRun, canUseSingularity } from 'utils/helpers.js'
import { networkMapFree } from 'utils/network.js'
import { factionServers, orgServers } from 'utils/constants.js'
const worldDaemon = "w0r1d_d43m0n"

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const nmap = networkMapFree()
  const player = getLSItem('PLAYER')

  let server = selectServer(nmap,player.skills.hacking)

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

function selectServer(nmap, playerHacking) {
  const daemon = nmap[worldDaemon]
  if (daemon && serverIsBackdoorable(daemon, playerHacking))
    return daemon

  // shuffle the array semi-randomly so there are less collisions
  const shuffledServers = Object.values(nmap).sort(() => .5 - Math.random())
  const factionServer = findServer(shuffledServers,
                                   playerHacking,
                                   Object.keys(factionServers))
  if (factionServer)
    return factionServer

  const orgServer = findServer(shuffledServers,
                               playerHacking,
                               Object.keys(orgServers))
  if (orgServer)
    return orgServer

  if (!canUseSingularity())
    return false

  return shuffledServers.find(s => serverIsBackdoorable(s, playerHacking))
}

function findServer(servers, playerHacking, preferred) {
  let server = servers.find(s =>
    preferred.includes(s.hostname) &&
    serverIsBackdoorable(s, playerHacking)
  )
  if (server)
    return server
  return false
}

function serverIsBackdoorable(server, playerHacking) {
  return !server.backdoorInstalled &&
    !server.purchasedByPlayer &&
    playerHacking >= server.requiredHackingSkill &&
    server.hasAdminRights
}
