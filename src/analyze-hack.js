import { disableLogs } from './helpers.js'

export async function main(ns) {
  ns.tprint('here')
  disableLogs(ns, ["scan", "scp", "sleep"])

  var to_scan = ['home'].concat(ns.scan('home'));

  for (var i = 1; i < to_scan.length; i++) {
    var target = to_scan[i];
    var add_to_scan = ns.scan(target);
    for (var j = 0; j < add_to_scan.length; j++) {
      var a = add_to_scan[j];
      if (!to_scan.includes(a)) {
        to_scan.push(a);
      }
    }
  }

  var weaken_ram = 1.75;
  var grow_ram = 1.75;
  var hack_ram = 1.7;

  var flags = ns.flags([
    ['all', false],
    ['at-hack-level', 0],
  ]);

  var player = ns.getPlayer();
  if (flags['at-hack-level']) player.hacking_skill = flags['at-hack-level'];
  var servers = to_scan.map(ns.getServer);
  var ram_total = servers.reduce(function (total, server) {
    if (!(flags['all'] || server.hasAdminRights)) return total;
    return total + server.maxRam;
  }, 0);
  var server_eval = servers.filter(server => (flags['all'] || server.hasAdminRights && server.requiredHackingSkill <= player.hacking_skill)
    && !server.purchasedByPlayer && server.moneyMax > 0)
    .map(function (server) {
      server.hackDifficulty = server.minDifficulty;
      let real_player_hack_skill = player.hacking_skill;
      // If necessary, temporarily fake the hacking skill to get the numbers for when this server will first be unlocked
      if (server.requiredHackingSkill > real_player_hack_skill)
        player.hacking_skill = server.requiredHackingSkill;
      var growGain = Math.log(ns.formulas.basic.growPercent(server, 1, player, 1));
      var growCost = grow_ram * ns.formulas.basic.growTime(server, player);
      var hackGain = Math.log(ns.formulas.basic.hackPercent(server, player)) * ns.formulas.basic.hackChance(server, player);
      var hackCost = hack_ram * ns.formulas.basic.hackTime(server, player);
      var weakenCost = weaken_ram * ns.formulas.basic.weakenTime(server, player);
      growCost += weakenCost * 0.004 / 0.05;
      hackCost += weakenCost * 0.002 / 0.05;
      server.gainRate = server.moneyMax / (growCost / growGain + hackCost / hackGain);
      server.expRate = ns.formulas.basic.hackExp(server, player) * (1 + 0.002 / 0.05) / (hackCost);
      player.hacking_skill = real_player_hack_skill; // Restore the real hacking skill if we changed it temporarily
      ns.print(server.hostname, ": Theoretical $", server.gainRate, ", limit ", ns.nFormat(server.moneyMax * 0.1 / ram_total, "$0.000a") , ", exp ", server.expRate);
      server.gainRate = Math.min(server.gainRate, server.moneyMax * 0.1 / ram_total);
      return server;
    });
  var best_server = server_eval.sort(function (a, b) {
    return b.gainRate - a.gainRate;
  })[0];
  ns.tprint("Best server: ", best_server.hostname, " with ", ns.nFormat(best_server., "$0.000a"), " per ram-second");
  ns.print(`\nServers in order of best to worst hack money at Hack ${player.hacking_skill}:`);
  let order = 1;
  for (const server of server_eval) {
    ns.print(` ${order++} ${server.hostname}, with ${ns.nFormat(server.gainRate, "$0.000a")} per ram-second`);
  }

  var best_exp_server = server_eval.sort(function (a, b) {
    return b.expRate - a.expRate;
  })[0];
  ns.tprint("Best exp server: ", best_exp_server.hostname, " with ", best_exp_server.expRate, " exp per ram-second");
  ns.print("\nServers in order of best to worst hack XP:");
  order = 1;
  for (let i = 0; i < 5; i++) {
    ns.tprint(` ${order++} ${server_eval[i].hostname}, with ${server_eval[i].expRate.toPrecision(3)} exp per ram-second`);
  }

  ns.write('/Temp/analyze-hack.txt', JSON.stringify(server_eval.map(s => ({
    hostname: s.hostname,
    gainRate: s.gainRate,
    expRate: s.expRate
  }))), "w");
  // Below is stats for hacknet servers - uncomment at cost of 4 GB Ram
  /*
  var hacknet_nodes = [...(function* () {
    var n = ns.hacknet.numNodes();
    for (var i = 0; i < n; i++) {
      var server = ns.hacknet.getNodeStats(i);
      server.gainRate = 1000000 / 4 * server.production / server.ram;
      yield server;
    }
  })()];
  var best_hacknet_node = hacknet_nodes.sort(function (a, b) {
    return b.gainRate - a.gainRate;
  })[0];
  if (best_hacknet_node) ns.tprint("Best hacknet node: ", best_hacknet_node.name, " with $", best_hacknet_node.gainRate, " per ram-second");
  */
}
