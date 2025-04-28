import { fetchPlayer, toolsCount } from 'utils/helpers.js'
import { fetchServerFree } from 'utils/network.js'

export function autocomplete(data, args) {
  return data.servers
}

/**
 * @param {NS} ns
 * @param {string} target
 **/
export function root (ns, target) {
  let player = fetchPlayer()

  if (target.hasAdminRights) {
    ns.print("Have root access already: " + target.name)
    return
  }

  if ( target.portsRequired > toolsCount() ) {
    ns.print("Not enough tools to nuke this server.")
    return
  }

  if (player.programs.includes("BruteSSH.exe")) {
    ns.brutessh(target.name)
  }
  if (player.programs.includes("FTPCrack.exe")) {
    ns.ftpcrack(target.name)
  }
  if (player.programs.includes("HTTPWorm.exe")) {
    ns.httpworm(target.name)
  }
  if (player.programs.includes("relaySMTP.exe")) {
    ns.relaysmtp(target.name)
  }
  if (player.programs.includes("SQLInject.exe")) {
    ns.sqlinject(target.name)
  }

  var ret = ns.nuke(target.name)
  ns.print("Sudo aquired: " + ret)
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  var targetName = ns.args[0]

  if (targetName === undefined) {
    ns.tprint("Must choose a target to root, `run rooter.js n00dles`")
    ns.exit()
    return;
  }
  let target = fetchServerFree(targetName)
  if (!target) {
    ns.tprint("NMAP is not populated, try again later.")
    return
  }
  ns.print("Target: " + target.hostname)
  root(ns, target)
}
