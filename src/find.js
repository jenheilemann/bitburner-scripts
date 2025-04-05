import { canUseSingularity, runCommand, getLSItem } from 'helpers.js'
import { factionServers as targets } from 'constants.js'

export function autocomplete(data, args) {
  return data.servers
}

export async function main(ns) {
  let path;

  if (ns.args[0] === undefined) {
    for (const server in targets) {
      ns.tprint("*********** " + server + " ( " + targets[server] + " faction)")
      path = mapPath(server)
      ns.tprint(printablePathToServer(path, true))
    }
  } else {
    path = mapPath(ns.args[0])
    ns.tprint(printablePathToServer(path, ns.args[1]))
    if ( canUseSingularity() ) {
      let cmd = path.map((step) => `ns.singularity.connect('${step}');`).join("")
      if (ns.args[1]) cmd += '; backdoor'
      await runCommand(ns, cmd, '/Temp/connect.js')
    }
  }
}

function printablePathToServer(path, backdoor = false) {
  let msg = path.join("; connect ")
  if (backdoor) {
    msg += "; backdoor;"
  }
  return msg
}

function mapPath(goal) {
  let nMap = getLSItem('NMAP')
  let path = []

  // @ignore-infinite
  while (true) {
    path.unshift(goal)
    goal = nMap[goal].parent
    if (goal == '') {
      return path
    }
  }
}
