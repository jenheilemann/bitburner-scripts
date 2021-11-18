import { factionServers as targets } from 'constants.js'
import { findPath } from 'network.js'

export function autocomplete(data, args) {
  return Object.keys(targets)
}

export async function main(ns) {
  let path;

  if (ns.args[0] === undefined) {
    for (const server in targets) {
      ns.tprint("*********** " + server + " ( " + targets[server] + " faction)")
      path = await findPath(server)
      ns.tprint(printablePathToServer(path, true))
    }
  } else {
    path = await findPath(ns.args[0])
    ns.tprint(printablePathToServer(path))
    path.forEach((step) => ns.connect(step))
  }
}

function printablePathToServer(path, backdoor = false) {
  let msg = path.join("; connect ")
  if (backdoor) {
    msg += "; backdoor;"
  }
  return msg
}
