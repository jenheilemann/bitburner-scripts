export const rootFiles = [
  { name: "BruteSSH.exe", cost: 500000, },
  { name: "FTPCrack.exe", cost: 1500000, },
  { name: "relaySMTP.exe", cost: 5000000, },
  { name: "HTTPWorm.exe", cost: 30000000, },
  { name: "sqlinject.exe", cost: 250000000, },
]

export const purchaseables = rootFiles.concat([
    // { name: "Formulas.exe", cost: 5000000000, }
  ])

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

export const lsKeys = {
  nmap : 'jh_network_map'
}

export async function tryRun(ns, callback) {
  let pid = callback()
  while (pid == 0) {
    await ns.sleep(300)
    pid = callback()
  }
  return pid
}

export function getLSItem(key) {
  let item = localStorage.getItem(key)

  return item ? JSON.parse(item) : undefined
}

export function setLSItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
