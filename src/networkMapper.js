import { setLSItem } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export class NetworkMapper {
  constructor(ns) {
    ns.print("Initializing new Network object");
    this.filename = 'network_map.txt';
    this.serverData = {};
    this.serverData['home'] = this.aggregateData(ns, 'home', '');
    this.serverList = ['home'];
    this.walkServers(ns);
  }

  walkServers(ns) {
    for (var i = 0; i < this.serverList.length; i++) {
      ns.scan(this.serverList[i]).forEach(function (host) {
        if (!this.serverList.includes(host)) {
          this.serverData[host] = this.aggregateData(ns, host, this.serverList[i]);
          this.serverList.push(host);
        }
      }, this);
    }
    return this.serverData;
  }

  async writeMap(ns) {
    setLSItem('NMAP', this.serverData)

    let line = "Name,MaxRam,PortsRequired," +
      "HackingLvl,MaxMoney,MinSecurity,Growth," +
      "Parent\r\n";
    await ns.write(this.filename, line, "w");

    let data = this.serverList.map(function (server) {
      return Object.values(this.serverData[server]).join(",");
    }, this);
    await ns.write(this.filename, data.join("\r\n"), "a");
    return;
  }

  aggregateData(ns, server, parent) {
    let sobj = {
      name: server,
      maxRam: ns.getServerMaxRam(server),
      portsRequired: ns.getServerNumPortsRequired(server),
      hackingLvl: ns.getServerRequiredHackingLevel(server),
      maxMoney: ns.getServerMaxMoney(server),
      minSecurity: ns.getServerMinSecurityLevel(server),
      growth: ns.getServerGrowth(server),
      parent: parent,
    }
    updateData(ns, sobj)
    return sobj
  }
}

export function updateData(ns, server) {
  try {
    server.data = ns.getServer(server.name)
    server.files = ns.ls(server.name)
    server.security = ns.getServerSecurityLevel(server.name)
    // max ram changes sometimes w/ home, purchased servers
    server.maxRam = ns.getServerMaxRam(server.name)
    return server
  } catch {
    return server
  }
}


/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let mapper = new NetworkMapper(ns)

  ns.print(`Writing networkMap to local storage and ${mapper.filename}!`)
  await mapper.writeMap(ns)
}
