import { tryRun, disableLogs } from 'helpers.js'

const sec = 1000
const min = 60 * sec

/**
 * how long to wait between running a satellite file
 * time in ms
 **/
const timers = [
  { file: '/satellites/playerObserver.js', freq: 20, last: 0 },
  { file: '/satellites/serversObserver.js', freq: 0, last: 0 },
  { file: '/satellites/programObserver.js', freq: 2 * min, last: 0 },
  { file: '/satellites/backdoorObserver.js', freq: 30 * sec, last: 0 },
  { file: '/satellites/contractsObserver.js', freq: 5 * min, last: 0 },
  { file: 'nuker.js', freq: 45 * sec, last: 0 },
  { file: 'botnet.js', freq: 30 * sec, last: 0 },
  { file: 'stats.js', freq: 1 * sec, last: 0 },
  { file: '/satellites/activityObserver.js', freq: 1 * min, last: Date.now() },
  { file: '/satellites/pservObserver.js', freq: 5 * min, last: Date.now() },
  { file: '/satellites/hackerObserver.js', freq: min, last: 0 },
  { file: '/satellites/homeRamBuyer.js', freq: min, last: Date.now() },
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let first = true, proc

  while(true) {
    for ( const timer of timers) {
      proc = ns.ps('home').find(p => p.filename == timer.file)
      if (!proc && Date.now() > timer.last + timer.freq ) {
        await tryRun(ns, () => ns.run(timer.file, 1))
        timer.last = Date.now()
      }
      // spread out inits so player has time to propigate
      if ( first ) { await ns.sleep(50); first = false }
    }
    await ns.sleep(5)
  }
}
