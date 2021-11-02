// import { rootFiles, toolsCount } from 'helpers.js'

export function root (ns, target) {

  if (ns.hasRootAccess(target)) {
    ns.print("Have root access already")
    return
  }

  if (ns.fileExists("BruteSSH.exe", "home")) {
    ns.brutessh(target)
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    ns.ftpcrack(target)
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    ns.httpworm(target)
  }
  if (ns.fileExists("relaySMTP.exe", "home")) {
    ns.relaysmtp(target)
  }
  if (ns.fileExists("sqlinject.exe", "home")) {
    ns.sqlinject(target)
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
