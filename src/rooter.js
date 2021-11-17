import { fetchPlayer } from 'helpers.js'

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
  if (player.programs.includes("sqlinject.exe")) {
    ns.sqlinject(target.name)
  }

  var ret = ns.nuke(target)
  ns.print("Sudo aquired: " + ret)
}

/**
 * @param {NS} ns
 **/
export function main(ns) {
  var target = ns.args[0]

  if (target === undefined) {
    ns.tprint("Must choose a target to root, `run Rooter.js n00dles`")
    ns.exit()
    return;
  }
  root(ns, target)
}
