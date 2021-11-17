import { fetchPlayer, toolsCount } from 'helpers.js'
import { fetchServer } from 'network.js'

/**
 * @param {NS} ns
 * @param {string} target
 **/
export function root (ns, target) {
  let player = fetchPlayer()

  if (target.data.hasAdminRights) {
    ns.print("Have root access already")
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
  let target = await fetchServer(ns, targetName)
  root(ns, target)
}
