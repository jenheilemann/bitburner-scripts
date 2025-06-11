import { disableLogs, formatDuration } from 'utils/helpers.js'

const sec = 1000
const min = 60 * sec
const reportRefreshRate = min

/**
 * how long to wait between running a satellite file
 * 'freq' is time in ms, selected as prime numbers to reduce clashes
 **/
const timers = [
  // these are sorted by frequency, except playerObserver which must run first
  { file: 'satellites/playerObserver.js',    freq: 83,     last: 0 },

  { file: 'satellites/networkObserver.js',   freq: 73,     last: 0 },
  { file: 'satellites/batchObserver.js',     freq: 499,    last: Date.now() },
  { file: 'stats.js',                        freq: 1003,   last: 0 },
  // { file: 'satellites/gangClashObserver.js', freq: 1.3*sec,   last: 0 },
  // { file: 'gang/equipment.js',               freq: 5.2*sec,   last: 0 },
  // { file: 'gang/recruitment.js',             freq: 5.3*sec,   last: 0 },
  // { file: 'satellites/gangMetaObserver.js',  freq: 5.4*sec,   last: 0 },
  { file: 'nuker.js',                         freq: 7001,   last: 0 },
  { file: 'botnet.js',                        freq: 8009,   last: 0 },
  // { file: 'gang/ascend.js',                  freq: 8.1*sec,   last: 0 },
  // { file: 'gang/augments.js',                freq: 12 *sec,   last: 0 },
  { file: 'satellites/backdoorObserver.js',  freq: 20347,  last: 0 },
  // { file: 'gang/tasks.js',                   freq: 30 *sec,   last: 0 },
  // { file: 'sleeves/metaObserver.js',         freq: 31 * sec,  last: Date.now() },
  // { file: 'sleeves/manager.js',              freq: 31.1*sec,  last: Date.now() },
  { file: 'satellites/programObserver.js',   freq: 33751,  last: 0 },
  // { file: 'satellites/activityObserver.js',  freq: min,       last: Date.now() },
  { file: 'satellites/homeRamObserver.js',   freq: 63577,  last: Date.now() },
  { file: 'satellites/pservObserver.js',     freq: 63901,  last: Date.now() },
  { file: 'satellites/contractsObserver.js', freq: 119993, last: Date.now() },

]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep','run'])
  ns.ui.openTail()
  ns.ui.resizeTail(740,400)
  let report = new Report()
  let proc

  while(true) {
    ns.clearLog()
    for ( const timer of timers) {
      proc = ns.ps('home').some(p => p.filename == timer.file)
      if (!proc && Date.now() > timer.last + timer.freq ) {
        let res = ns.run(timer.file, 1)
        if (res > 0 ) {
          timer.last = Date.now()
          report.success(timer)
        } else {
          report.failure(timer)
        }
      }
    }
    report.refresh()
    report.print(ns)
    await ns.sleep(2)
  }
}

class Report {
  constructor() {
    this.happenings = {}
  }
  success(satellite) {
    if (!(satellite.file in this.happenings))
      this.happenings[satellite.file] = { success: [], failure: []}
    this.happenings[satellite.file].success.push(Date.now())
  }
  failure(satellite) {
    if (!(satellite.file in this.happenings))
      this.happenings[satellite.file] = { success: [], failure: []}
    this.happenings[satellite.file].failure.push(Date.now())
  }
  print(ns) {
    ns.print(`Rolling report of files run in the last ${formatDuration(reportRefreshRate)}`)
    ns.print('**************************************************************')
    ns.print('| Filename'.padEnd(38) + '| Successes | Failures |')
    ns.print('--------------------------------------------------------------')
    for (let filename in this.happenings) {
      let rep = this.happenings[filename]
      ns.print(`${filename.padEnd(37)} | ${rep.success.length.toString().padStart(9)} | ${rep.failure.length.toString().padStart(8)} |`)
    }
    ns.print('**************************************************************')
  }
  refresh() {
    let currentTime = Date.now()
    let cutOffTime = currentTime - reportRefreshRate
    for (let file in this.happenings) {
      let rep = this.happenings[file]
      rep.success = rep.success.filter(t => t > cutOffTime)
      rep.failure = rep.failure.filter(t => t > cutOffTime)
    }
  }
}
