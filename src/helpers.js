import { rootFiles, purchaseables,lsKeys } from "constants.js"

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
  let pid = callback()
  while (pid == 0) {
    await ns.sleep(300)
    pid = callback()
  }
  return pid
}

export function getLSItem(key) {
  let item = localStorage.getItem(lsKeys[key.toUpperCase()])

  return item ? JSON.parse(item) : undefined
}

export function setLSItem(key, value) {
  localStorage.setItem(lsKeys[key.toUpperCase()], JSON.stringify(value))
}

export function clearLSItem(key) {
  localStorage.removeItem(lsKeys[key.toUpperCase()])
}
