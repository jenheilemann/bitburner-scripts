import { networkMapFree } from 'utils/network.js'

const hangableFiles = [
  'batchGrow.js', 
  'batchHack.js',
  'batchWeaken.js'
]
const badLog = "Waiting for port write."

/** @param {NS} ns */
export async function main(ns) {
  let map = networkMapFree()
  for (let server of Object.values(map)) {
    ns.print(server.hostname)
    let scripts = ns.ps(server.hostname)
    for (let s of scripts) {
      if (!hangableFiles.includes(s.filename))
        continue
      let script = ns.getRunningScript(s.pid)
      if (!script.logs[script.logs.length-1].includes(badLog))
        continue
      if (script.onlineRunningTime < 5)
        continue
      ns.print(`--- ${script.filename} ${script.onlineRunningTime}`)
      ns.kill(s.pid)
    }
  }
}
