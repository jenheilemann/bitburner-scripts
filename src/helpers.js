export const rootFiles = [
  { name: "BruteSSH.exe", cost: 500000, },
  { name: "FTPCrack.exe", cost: 1500000, },
  { name: "relaySMTP.exe", cost: 5000000, },
  { name: "HTTPWorm.exe", cost: 30000000, },
  { name: "sqlinject.exe", cost: 250000000, },
]

export const purchaseables = rootFiles.concat([{ name: "Formulas.exe", cost: 5000000000, }])

export function toolsCount(ns) {
  let count = 0
  rootFiles.forEach((file) => { if (ns.fileExists(file.name)) { count++ } }, ns)
  return count
}

export function disableLogs(ns, functions) {
  functions.forEach((funct) => ns.disableLog(funct))
}

function myMoney(ns) {
  return ns.getServerMoneyAvailable('home')
}

export async function waitForCash(ns, cost) {
  if ((myMoney(ns) - reserve(ns)) >= cost) {
    ns.print("I have enough: " + ns.nFormat(cost, "$0.000a"))
    return;
  }
  ns.print("Waiting for " + ns.nFormat(cost + reserve(ns), "$0.000a"))
  while ((myMoney(ns) - reserve(ns)) < cost) {
    await ns.sleep(3000)
  }
}

export function reserve(ns) {
  for ( const file of purchaseables ) {
    if (!ns.fileExists(file.name, 'home')) {
      return file.cost
    }
  }
  return 0
}

export async function tryRun(ns, callback) {
  let pid = 0
  do {
    pid = callback()
    await ns.sleep(300)
  } while (pid == 0)
  return pid
}
