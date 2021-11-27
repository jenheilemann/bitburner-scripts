import { tryRun, disableLogs } from 'helpers.js'

const sec = 1000
const min = 60 * sec

/**
 * how long to wait between running a satellite file
 * time in ms
 **/
const timers = [
  { file: '/satellites/playerObserver.js', freq: 100, last: 0 },
  { file: '/satellites/serversObserver.js', freq: 50, last: 0 },
  { file: '/satellites/programObserver.js', freq: 2 * min, last: 0 },
  { file: '/satellites/backdoorObserver.js', freq: 30 * sec, last: 0 },
  { file: '/satellites/contractsObserver.js', freq: 10 * min, last: 0 },
  { file: 'nuker.js', freq: 45 * sec, last: 0 },
  { file: 'botnet.js', freq: 30 * sec, last: 0 },
  { file: 'stats.js', freq: 1 * sec, last: 0 },
  { file: '/satellites/activityObserver.js', freq: 1 * sec, last: Date.now() + min },
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  let first = true

  while(true) {
    for ( const timer of timers) {
      if ( Date.now() > timer.last + timer.freq ) {
        await tryRun(ns, () => ns.run(timer.file, 1))
        timer.last = Date.now()
      }
      // spread out inits so player has time to propigate
      if ( first ) { await ns.sleep(50); first = false }
    }
    await ns.sleep(20)
  }
}
