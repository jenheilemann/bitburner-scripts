
export const factionServers = {
  "CSEC"         : "CyberSec",
  "avmnite-02h"  : "NiteSec",
  "I.I.I.I"      : "The Black Hand",
  "run4theh111z" : "BitRunners",
  "The-Cave"     : "Daedalus",
}

export const rootFiles = [
  { name: "BruteSSH.exe", cost: 500000, },
  { name: "FTPCrack.exe", cost: 1500000, },
  { name: "relaySMTP.exe", cost: 5000000, },
  { name: "HTTPWorm.exe", cost: 30000000, },
  { name: "SQLInject.exe", cost: 250000000, },
]

export const purchaseables = rootFiles.concat([
  // { name: "Formulas.exe", cost: 5000000000, }
])


export const gangEquipment = {
  weapons  : ["Baseball Bat","Katana","Glock 18C","P90C","Steyr AUG","AK-47","M15A10 Assault Rifle","AWM Sniper Rifle"],
  armor    : ["Bulletproof Vest","Full Body Armor","Liquid Body Armor","Graphene Plating Armor"],
  vehicles : [ "Ford Flex V20","ATX1070 Superbike","Mercedes-Benz S9001","White Ferrari"],
  rootkits : ["NUKE Rootkit","Soulstealer Rootkit","Demon Rootkit","Hmap Node","Jack the Ripper"],
  hackAugs   : ["BitWire","Neuralstimulator","DataJack"],
  combatAugs : ["Bionic Arms","Bionic Legs","Bionic Spine","BrachiBlades","Nanofiber Weave","Synthetic Heart","Synfibril Muscle","Graphene Bone Lacings"],
}

export const lsKeys = {
  NMAP : 'jh_network_map',
  PLAYER : 'jh_player',
  RESERVE : 'jh_reserve',
  BITNODE : 'jh_bn_multipliers',
  SOURCEFILES : 'jh_owned_sourcefiles',
  WORKING : 'jh_working',
  DECOMMISSIONED : 'jh_decommissioned',
  HACKPERCENT : 'jh_hack_percent',
  CLASHTIME : 'jh_next_territory_warefare',
  GANGMETA : 'jh_gang_information',
  SLEEVEMETA : 'jh_sleeve_information',
}
