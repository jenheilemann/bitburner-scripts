import { networkMapFree } from 'network.js'
import { clearLSItem } from 'utils/helpers.js'

const hangableFiles = [
  'batchGrow.js', 
  'batchHack.js',
  'batchWeaken.js'
]
const badLog = "Waiting for port write."


/** @param {NS} ns */
export async function main(ns) {
  cleanOldBatchRecords()
  cleanHangingFiles(ns)
}

function cleanOldBatchRecords() {
  clearLSItem('batches')
}

/** @param {NS} ns */
function cleanHangingFiles(ns) {
  let map = networkMapFree()
  for (let server of Object.values(map)) {
    let scripts = ns.ps(server.hostname)
    for (let s of scripts) {
      if (!hangableFiles.includes(s.filename))
        continue
      let script = ns.getRunningScript(s.pid)
      if (!script.logs[script.logs.length-1].includes(badLog))
        continue
      if (script.onlineRunningTime < 5)
        continue
      ns.print(server.hostname)
      ns.print(`--- ${script.filename} ${script.onlineRunningTime}`)
      ns.kill(s.pid)
    }
  }
}
