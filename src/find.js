import { networkMap } from "network.js"

const targets = {
  "CSEC":         "CyberSec",
  "avmnite-02h":  "NiteSec",
  "I.I.I.I":      "The Black Hand",
  "run4theh111z": "Bitrunners",
  "The-Cave":     "Daedalus",
}

export function autocomplete(data, args) {
  return Object.keys(targets)
}

export async function main(ns) {
  let nMap = networkMap(ns).serverData
  if ( ns.args[0] === undefined ) {
    for ( const server in targets ) {
      ns.tprint("** " + server + " ( " + targets[server] + " faction)")
      printPathToServer(ns, server, nMap, true)
    }
  } else {
    printPathToServer(ns, ns.args[0], nMap)
  }
  // path.forEach( (step) => ns.connect(step) )
}

function printPathToServer(ns, target, nMap, backdoor = false) {
  let path = findPath(target, nMap)
  ns.tprint(path)
  let msg = ""
  path.forEach((step) => msg += "connect " + step + ";")
  if ( backdoor ) {
    msg += "backdoor;"
  }
  ns.tprint(msg)
}

function findPath(goal, servers) {
  let path = []
  while (true) {
    path.unshift(goal)
    goal = servers[goal].parent
    if (goal == 'home') {
      return path
    }
  }
}
