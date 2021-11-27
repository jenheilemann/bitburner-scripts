import { toolsCount, announce, getLSItem } from 'helpers.js'
const sec = 1000, min = 60*sec, hour = 60*min

/** @param {NS} ns **/
export async function main(ns) {
  const processes = ns.ps('home')
  const crimePS   = processes.find(p => p.filename === 'crime.js')
  const factionPS = processes.find(p => p.filename === 'workForFactions.js')

  // if I set the working key within the last hour, don't change anything
  if ( getLSItem('working') > Date.now() - hour ) {
    ns.kill('crime.js', 'home')
    ns.kill('workForFactions.js', 'home')
    return
  }

  if ( toolsCount() >= 5 ) {
    if ( crimePS ) {
      announce(ns, 'Switching from crime to grinding faction rep')
      ns.kill('crime.js', 'home')
    }
    if ( !factionPS ) {
      announce(ns, 'Starting work for factions...')
      ns.run('workForFactions.js')
    }
    return
  }

  if ( !crimePS ) {
    ns.run('crime.js')
  }
}
