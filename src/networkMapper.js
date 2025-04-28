import { disableLogs, setLSItem } from 'utils/helpers.js'

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


/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let map = mapNetwork(ns)
  setLSItem('nmap', map)
}

/**
 * @param {NS} ns
 **/
export function mapNetwork(ns) {
  disableLogs(ns, ['scan'])
  let map = walkServers(ns)
  return map
}
