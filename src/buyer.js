import { BestHack } from 'bestHack.js'
import { networkMap } from 'network.js'
import { toolsCount } from 'rooter.js'

const script = "get-money.script"
const ram = Math.pow(2, 7);

export async function main(ns) {
  ns.disableLog('getServerMoneyAvailable')
  ns.disableLog('sleep')

  if (ns.args[0] == 'kill') {
    let pServs = ns.getPurchasedServers()
    pServs.forEach((serv) => {
      ns.scriptKill(script, serv)
      ns.deleteServer(serv)
    }, ns)
  }

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
      ns.tprint("Targeting " + target.name + ", ensuring sudo first.")
      ns.run("hack-server.script", 1, target.name, 0)

      hostname = ns.purchaseServer("pserv-" + i, ram);
      ns.scp(script, hostname);
      ns.exec(script, hostname, threads, target.name);
      ++i;
    }
    await ns.sleep(4000);
  }
  ns.tprint("I've bought all the servers I can. It's up to you now.")
}
