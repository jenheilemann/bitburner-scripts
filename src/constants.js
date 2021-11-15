
export const faction_servers = {
  "CSEC"         : "CyberSec",
  "avmnite-02h"  : "NiteSec",
  "I.I.I.I"      : "The Black Hand",
  "run4theh111z" : "Bitrunners",
  "The-Cave"     : "Daedalus",
}

export const rootFiles = [
  { name: "BruteSSH.exe", cost: 500000, },
  { name: "FTPCrack.exe", cost: 1500000, },
  { name: "relaySMTP.exe", cost: 5000000, },
  { name: "HTTPWorm.exe", cost: 30000000, },
  { name: "sqlinject.exe", cost: 250000000, },
]

export const purchaseables = rootFiles.concat([
  // { name: "Formulas.exe", cost: 5000000000, }
])


export const lsKeys = {
  NMAP : 'jh_network_map'
}
