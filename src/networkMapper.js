import { setLSItem, lsKeys } from 'helpers.js'

/**
 * @param {NS} ns
 **/
export class NetworkMapper {
  constructor(ns) {
    ns.tprint("Initializing new Network object");
    this.filename = 'network_map.txt';
    this.serverData = {};
    this.serverData['home'] = this.aggregateData(ns, 'home', '');
    this.serverList = ['home'];
    this.walkServers(ns);
  }

  walkServers(ns) {
    for (var i = 0; i < this.serverList.length; i++) {
      ns.scan(this.serverList[i]).forEach(function (host) {
        if (host.includes('pserv-')) {
          return;
        }
        if (this.serverList.indexOf(host) == -1) {
          this.serverData[host] = this.aggregateData(ns, host, this.serverList[i]);
          this.serverList.push(host);
        }
      }, this);
    }
    return this.serverData;
  }

  async writeMap(ns) {
    setLSItem(lsKeys['nmap'], this.serverData)

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
    return {
      name: server,
      maxRam: ns.getServerMaxRam(server),
      portsRequired: ns.getServerNumPortsRequired(server),
      hackingLvl: ns.getServerRequiredHackingLevel(server),
      maxMoney: ns.getServerMaxMoney(server),
      minSecurity: ns.getServerMinSecurityLevel(server),
      growth: ns.getServerGrowth(server),
      parent: parent
    };
  }
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let mapper = new NetworkMapper(ns)

  ns.tprint("writing networkMap to local storage!")
  await mapper.writeMap(ns)
}
