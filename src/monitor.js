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
  ns.ui.resizeTail(560, 205)

  //@ignore-infinite
  while (true) {
    ns.clearLog();
    let server = fetchServer(ns, serverName)
    ns.print(`${serverName} ${runSpinner()}`)
    ns.print(`*** Growth   : ${server.serverGrowth}`)
    let percent = Math.round((server.moneyAvailable / server.moneyMax) * 100)
    ns.print(`*** Money    : \$${ns.formatNumber(server.moneyAvailable)} / \$${ns.formatNumber(server.moneyMax)} (${(percent)}%)`)
    ns.print(`*** Security : ${server.hackDifficulty}/${ns.formatNumber(server.minDifficulty, 0)}`)

    let hackThreads = Math.ceil(ns.hackAnalyzeThreads(server.hostname, server.moneyAvailable * 0.05))
    let hackTime = ns.getHackTime(server.hostname)
    ns.print(`* Hack       : ${hackThreads.toString().padStart(3," ")} (Time: ${formatTime(hackTime)})`)

    let weakThreads = Math.ceil((server.hackDifficulty - server.minDifficulty)/0.05)
    let weakTime = hackTime * 4
    ns.print(`* Weaken     : ${weakThreads.toString().padStart(3," ")} (Time: ${formatTime(weakTime)})`)

    let multiplier = server.moneyMax / Math.max(server.moneyAvailable, 1)
    let growThreads = Math.ceil(ns.growthAnalyze(server.hostname, multiplier))
    let growTime = hackTime * 3.2
    ns.print(`* Grow       : ${growThreads.toString().padStart(3," ")} (Time: ${formatTime(growTime)})`)
    

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
  spinnerIncrementor = (spinnerIncrementor + 1) % (spinnerText.length * 15)
  // return spinnerIncrementor + " " +Math.floor((spinnerIncrementor/30)) % spinnerText.length

  return spinnerText[spinnerIncrementor % spinnerText.length].padStart(Math.floor(spinnerIncrementor/(spinnerText.length)), '.')
}
