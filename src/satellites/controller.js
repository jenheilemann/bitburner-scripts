import { tryRun, disableLogs } from 'helpers.js'

const sec = 1000
const min = 60 * sec

/**
 * how long to wait between running a satellite file
 * time in ms
 **/
const timers = [
  // these are sorted by frequency, except playerObserver which must run first
  { file: '/satellites/playerObserver.js',    freq: 20,        last: 0 },

  { file: '/satellites/serversObserver.js',   freq: 0,         last: 0 },
  { file: 'stats.js',                         freq: 1 * sec,   last: 0 },
  { file: '/satellites/gangClashObserver.js', freq: 1.3*sec,   last: 0 },
  { file: '/satellites/programObserver.js',   freq: 5 * sec,   last: 0 },
  { file: '/gang/equipment.js',               freq: 5.2*sec,   last: 0 },
  { file: '/gang/recruitment.js',             freq: 5.3*sec,   last: 0 },
  { file: '/satellites/gangMetaObserver.js',  freq: 5.4*sec,   last: 0 },
  { file: '/satellites/backdoorObserver.js',  freq: 6 * sec,   last: 0 },
  { file: 'nuker.js',                         freq: 7 * sec,   last: 0 },
  { file: 'botnet.js',                        freq: 8 * sec,   last: 0 },
  { file: '/gang/ascend.js',                  freq: 8.1*sec,   last: 0 },
  { file: '/gang/augments.js',                freq: 12 *sec,   last: 0 },
  { file: '/gang/tasks.js',                   freq: 30 *sec,   last: 0 },
  { file: '/sleeves/metaObserver.js',         freq: 31 * sec,  last: Date.now() },
  { file: '/sleeves/manager.js',              freq: 31.1*sec,  last: Date.now() },
  { file: '/satellites/activityObserver.js',  freq: min,       last: Date.now() },
  { file: '/satellites/pservObserver.js',     freq: min+100,   last: Date.now() },
  { file: '/satellites/hackerObserver.js',    freq: min+200,   last: 0 },
  { file: '/satellites/homeRamBuyer.js',      freq: min+300,   last: Date.now() },
  { file: '/satellites/contractsObserver.js', freq: 4 * min,   last: 0 },
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
        await tryRun(() => ns.run(timer.file, 1))
        timer.last = Date.now()
      }
      // spread out inits so player has time to propigate
      if ( first ) { await ns.sleep(50); first = false }
    }
    await ns.sleep(5)
  }
}
