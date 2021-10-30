export const rootFiles = [
  "BruteSSH.exe",
  "FTPCrack.exe",
  "HTTPWorm.exe",
  "relaySMTP.exe",
  "sqlinject.exe",
]

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
  if ( myMoney(ns) >= cost ) {
    ns.print("I have enough: " + ns.nFormat(cost, "$0.000a"))
    return;
  }
  ns.print("Waiting for " + ns.nFormat(cost, "$0.000a"))
  while (myMoney(ns) < cost) {
    await ns.sleep(3000)
  }
}
