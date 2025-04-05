import { fetchServer } from 'network.js'
import { disableLogs } from 'helpers.js'

export function autocomplete(data, args) {
  return data.servers
}
let spinnerIncrementor = 0

/** @param {NS} ns */
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let serverName = ns.args[0]
  ns.ui.openTail()
  ns.ui.resizeTail(560, 225)

  //@ignore-infinite
  while (true) {
    ns.clearLog();
    let server = fetchServer(ns, serverName)
    ns.print(`${serverName} ${runSpinner()}`)
    let weakTime = ns.getWeakenTime(server.hostname)
    ns.print(`*** Growth   : ${server.serverGrowth}      Time : ${formatTime(weakTime)}`)
    let percent = Math.round((server.moneyAvailable / server.moneyMax) * 100)
    ns.print(`*** Money    : \$${ns.formatNumber(server.moneyAvailable)} / \$${ns.formatNumber(server.moneyMax)} (${(percent)}%)`)
    ns.print(`*** Security : ${server.hackDifficulty}/${ns.formatNumber(server.minDifficulty, 0)}`)

    let hackThreads = Math.ceil(ns.hackAnalyzeThreads(server.hostname, server.moneyAvailable * 0.05))
    ns.print(`* Hack       : ${hackThreads.toString().padStart(3," ")}`)

    let weakThreads = Math.ceil((server.hackDifficulty - server.minDifficulty)/0.05)
    let weakThForHack = Math.ceil(hackThreads/25)
    ns.print(`* Weaken     : ${weakThreads.toString().padStart(3," ")} (${weakThForHack})`)

    let multiplier = server.moneyMax / Math.max(server.moneyAvailable, 1)
    let growThreads = Math.ceil(ns.growthAnalyze(server.hostname, multiplier))
    multiplier = server.moneyMax / (Math.max(server.moneyAvailable, 1) * 0.95)
    let growThForHack = Math.ceil(ns.growthAnalyze(server.hostname, multiplier))
    ns.print(`* Grow       : ${growThreads.toString().padStart(3," ")} (${growThForHack})`)

    weakThreads = Math.ceil((server.hackDifficulty - server.minDifficulty)/0.05)
    weakThForHack = Math.ceil(growThForHack/12.5)
    ns.print(`* Weaken2    : ${weakThreads.toString().padStart(3," ")} (${weakThForHack})`)


    await ns.sleep(200)
  }
}
/**
 * @returns {string} Time string, formatted nicely
 */
function formatTime(timeInMs) {
  if (timeInMs > 1000 * 60 * 60 )
    return new Date(timeInMs).toISOString().slice(11, 23)
  if (timeInMs > 1000 * 60 )
    return new Date(timeInMs).toISOString().slice(14, 23)
  if (timeInMs > 1000 )
    return new Date(timeInMs).toISOString().slice(17, 23)
  return new Date(timeInMs).toISOString().slice(18, 23)
}

/**
 * @returns {string} A spinner that cycles through an animation
 */
function runSpinner() {
  let spinnerText = "|/-\\"
  spinnerIncrementor = (spinnerIncrementor + 1) % (spinnerText.length * 30)

  return spinnerText[spinnerIncrementor % spinnerText.length].padStart(Math.floor(spinnerIncrementor/(spinnerText.length)), '.')
}
