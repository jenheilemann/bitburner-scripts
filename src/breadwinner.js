/**
 * @param {NS} ns
 **/
export async function main(ns) {
  let target = ns.args[0]
  let maxMoney = ns.getServerMaxMoney(target)
  let moneyThreshhold = maxMoney * 0.8
  let securityThreshhold = ns.getServerMinSecurityLevel(target) + 3
  let money, threads, growFactor;
  let scriptThreads = ns.getRunningScript().threads

  while (true) {
    if (ns.getServerSecurityLevel(target) > securityThreshhold) {
      ns.print("Target security: " + securityThreshhold)
      await ns.weaken(target)
      continue
    }

    money = ns.getServerMoneyAvailable(target)
    if (money < moneyThreshhold) {
      ns.print("Current money: " + ns.nFormat(money, "$0.000a") +
        "  ---  Target money: " + ns.nFormat(moneyThreshhold, "$0.000a"))
      growFactor = maxMoney / money
      threads = Math.ceil(ns.growthAnalyze(target, growFactor))
      threads = Math.min(threads, scriptThreads)
      await ns.grow(target, { threads: threads });
      continue
    }

    if (money <= 0) {
      ns.print("Not enough money to hack, continuing", target, money)
      await ns.sleep(200)
      continue
    }

    threads = Math.floor(ns.hackAnalyzeThreads(target, money * 0.6))
    threads = Math.min(threads, scriptThreads)
    if (threads == -1) {
      ns.tprint("Threads negative! target ", target,
        " threads ", threads, "money ", nFormat(money, "$0.000a"),
        " money * 0.6 ", nFormat(money * 0.6, "$0.000a"),
        " hackAnalyzeThreads ", hackAnalyzeThreads(target, money * 0.6),
        " Math.floor ", Math.floor(hackAnalyzeThreads(target, money * 0.6)),
        " scriptThreads ", scriptThreads)
      await ns.sleep(200)
      continue
    }

    await ns.hack(target, { threads: threads })
  }
}
