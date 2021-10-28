import { networkMap } from "Network.js"

export async function main(ns) {
  let nMap = networkMap(ns).serverData
  let path = findPath(ns.args[0], nMap)
  ns.tprint(path)
  // path.forEach( (step) => ns.connect(step) )
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
