import { tryRun, disableLogs } from 'helpers.js'

const sec = 1000
const min = 60_000

/**
 * how long to wait between running a satellite file
 * 'freq' is time in ms, selected as prime numbers to reduce clashes
 **/
const timers = [
  // these are sorted by frequency, except playerObserver which must run first
  { file: '/satellites/playerObserver.js',    freq: 61,        last: 0 },

  { file: '/satellites/networkObserver.js',   freq: 43,         last: 0 },
  { file: '/satellites/batchObserver.js',     freq: 1009,       last: 0 },
  // { file: 'stats.js',                         freq: 1 * sec,   last: 0 },
  // { file: '/satellites/gangClashObserver.js', freq: 1.3*sec,   last: 0 },
  // { file: '/gang/equipment.js',               freq: 5.2*sec,   last: 0 },
  // { file: '/gang/recruitment.js',             freq: 5.3*sec,   last: 0 },
  // { file: '/satellites/gangMetaObserver.js',  freq: 5.4*sec,   last: 0 },
  { file: 'nuker.js',                         freq: 7001,   last: 0 },
  { file: 'botnet.js',                        freq: 8009,   last: 0 },
  // { file: '/gang/ascend.js',                  freq: 8.1*sec,   last: 0 },
  // { file: '/gang/augments.js',                freq: 12 *sec,   last: 0 },
  { file: '/satellites/backdoorObserver.js',  freq: 20347,  last: 0 },
  // { file: '/gang/tasks.js',                   freq: 30 *sec,   last: 0 },
  // { file: '/sleeves/metaObserver.js',         freq: 31 * sec,  last: Date.now() },
  // { file: '/sleeves/manager.js',              freq: 31.1*sec,  last: Date.now() },
  { file: '/satellites/programObserver.js',   freq: 33751,  last: 0 },
  // { file: '/satellites/activityObserver.js',  freq: min,       last: Date.now() },
  { file: '/satellites/homeRamObserver.js',   freq: 60317,  last: Date.now() },
  { file: '/satellites/pservObserver.js',     freq: 60773,  last: Date.now() },
  // { file: '/satellites/contractsObserver.js', freq: 4 * min,   last: Date.now() },
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
      if (!proc && performance.now() > timer.last + timer.freq ) {
        let res = ns.run(timer.file, 1)
        if (res > 0 ) {
          timer.last = performance.now()
        }
      }
      // spread out inits so player has time to propigate
      if ( first ) { await ns.sleep(50); first = false }
    }
    await ns.sleep(2)
  }
}
