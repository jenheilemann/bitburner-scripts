import { tryRun, disableLogs } from 'helpers.js'

/**
 * how long to wait between running a satellite file
 * time in ms
 **/
const timers = [
  { file: '/satellites/playerObserver.js', freq: 400, last: 0 },
  { file: '/satellites/serversObserver.js', freq: 200, last: 0 },
  { file: '/satellites/programObserver.js', freq: 2 * 60 * 1000, last: 0 },
  { file: '/satellites/backdoorObserver.js', freq: 2 * 60 * 1000, last: 0 },
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  while(true) {

    for ( const timer of timers) {
      if ( Date.now() > timer.last + timer.freq ) {
        await tryRun(ns, () => ns.run(timer.file, 1))
        timer.last = Date.now()
      }
    }
    await ns.sleep(200)
  }
}
