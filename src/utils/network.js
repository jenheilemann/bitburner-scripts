import { getLSItem, setLSItem } from 'utils/helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.tprint("ERROR: network.js not meant to be run independently. \nUsage: " +
    "import { networkMap } from 'utils/network.js'\n" +
    "\tlet map = networkMap(ns)\n" +
    "// OR \n"
    "\tlet map = networkMapFree(ns)\n" +
    )
}

/**
 * @param {NS} ns
 * @cost 2.4 GB
 **/
export function networkMap(ns) {
  disableLogs(ns, ['scan'])
  let map = walkServers(ns)
  return map
}

/**
 * @param {NS} ns
 * @param {string} serverName
 * @cost 2.4 GB
 **/
export function fetchServer(ns, serverName) {
  let map = networkMap(ns)
  return map[serverName]
}

/**
 * @param {string} serverName
 * @cost 0 GB
 **/
export function fetchServerFree(serverName) {
  let map = networkMapFree()

  if (!map) {
    return false
  }

  return map[serverName]
}

/**
 * @param {NS} ns
 * @cost 0 GB
 **/
export function networkMapFree() {
  let map = getLSItem('nmap')

  if ( !map ) {
    return false
  }

  return map;
}

/**
 * @param {NS} ns
 * @param {string} goal
 **/
export function findPath(goal) {
  let nMap = networkMapFree()

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


/**
 * @param {NS} ns
 **/
function walkServers(ns) {
  let serverData = {};
  let serverList = ['home'];
  serverData['home'] = updateData(ns, 'home', '');
  for (var i = 0; i < serverList.length; i++) {
    ns.scan(serverList[i]).forEach(function (host) {
      if (!serverList.includes(host)) {
        serverData[host] = updateData(ns, host, serverList[i]);
        serverList.push(host);
      }
    });
  }
  return serverData;
}

export function updateData(ns, server_name, parent) {
  let server
  try {
    server = ns.getServer(server_name)
    server.name = server_name
    server.portsRequired = server.numOpenPortsRequired
    server.hackingLvl = server.requiredHackingSkill
    server.maxMoney = server.moneyMax
    server.minSecurity = server.minDifficulty
    server.growth = server.serverGrowth
    server.parent = parent
    server.files = ns.ls(server.name)
    server.security = server.hackDifficulty
    server.availableRam = server.maxRam - server.ramUsed
  } catch(e) { ns.print(e.message) }
  return server
}


