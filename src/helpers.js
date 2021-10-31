export const rootFiles = [
  "BruteSSH.exe",
  "FTPCrack.exe",
  "HTTPWorm.exe",
  "relaySMTP.exe",
  "sqlinject.exe",
]

export const darkwebCosts = {
  "BruteSSH.exe": 500000,
  "FTPCrack.exe": 1500000,
  "relaySMTP.exe": 5000000,
  "HTTPWorm.exe" : 30000000,
  "sqlinject.exe": 250000000,
  "Formulas.exe" : 5000000000,
}

export function toolsCount(ns) {
  let count = 0
  rootFiles.forEach((fileName) => { if (ns.fileExists(fileName)) { count++ } }, ns)
  return count
}

export function disableLogs(ns, functions) {
  functions.forEach((funct) => ns.disableLog(funct))
}

function myMoney(ns) {
  return ns.getServerMoneyAvailable('home')
}

export async function waitForCash(ns, cost) {
  if ( (myMoney(ns) - reserve(ns)) >= cost ) {
    ns.print("I have enough: " + ns.nFormat(cost, "$0.000a"))
    return;
  }
  ns.print("Waiting for " + ns.nFormat(cost, "$0.000a"))
  while ( (myMoney(ns) - reserve(ns)) < cost) {
    await ns.sleep(3000)
  }
}

export function reserve(ns) {
  for (let filename in darkwebCosts ) {
    if ( !ns.fileExists(filename, 'home') ) {
      return darkwebCosts[filename]
    }
  }
  return 0
}
