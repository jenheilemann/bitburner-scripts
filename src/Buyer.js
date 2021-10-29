import { BestHack } from 'BestHack.js'
import { networkMap } from 'Network.js'
import { toolsCount } from 'Rooter.js'

const script = "get-money.script"
const ram = Math.pow(2, 7);

export async function main(ns) {
  if (ns.args[0] == 'kill') {
    let pServs = ns.getPurchasedServers()
    pServs.forEach((serv) => {
      ns.scriptKill(script, serv)
      ns.deleteServer(serv)
    }, ns)
  }

  ns.disableLog('getServerMoneyAvailable')
  ns.disableLog('sleep')
  ns.tprint("Buying " + ram + "GB RAM servers")

  const limit = ns.getPurchasedServerLimit();
  const cost = ns.getPurchasedServerCost(ram);
  ns.tprint("Buying " + limit + " servers for " + ns.nFormat(cost, "$0.000a") + " each")

  const ramRequired = ns.getScriptRam(script);
  const threads = Math.floor(ram / ramRequired)
  const searcher = new BestHack(networkMap(ns).serverData)

  let i = ns.getPurchasedServers().length;
  let target, hostname;

  while (i < limit) {
    if (ns.getServerMoneyAvailable("home") > cost) {
      target = searcher.findBestPerLevel(ns.getHackingLevel(), toolsCount(ns))
      hostname = ns.purchaseServer("pserv-" + i, ram);
      ns.scp(script, hostname);
      ns.exec(script, hostname, threads, target.name);
      ++i;
    }
    await ns.sleep(4000);
  }


}
