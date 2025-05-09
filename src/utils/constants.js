
// how much GB ram should be set aside on the home server for
// running the controller etc
export const reservedRam = 30

export const factionServers = {
  "CSEC"         : "CyberSec",
  "avmnite-02h"  : "NiteSec",
  "I.I.I.I"      : "The Black Hand",
  "run4theh111z" : "BitRunners",
  "."            : "The Dark Army",
  "The-Cave"     : "Daedalus"
}

export const orgServers = {
  "fulcrumassets"      : "Fulcrum Secret Technologies",
  "rothman-uni"        : "Rothman University",
  "summit-uni"         : "Summit University",
  "powerhouse-fitness" : "Powerhouse Gym",
  "iron-gym"           : "Iron Gym",
  "millenium-fitness"  : "Millenium Fitness Gym",
  "crush-fitness"      : "Crush Fitness Gym",
  "snap-fitness"       : "Snap Fitness Gym",
  "aevum-police"       : "Aevum Police Headquarters",
}

export const specialServers = {...factionServers, ...orgServers}

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
  BATCHES : 'jh_batches',
  BATCHJOBID : 'jh_batchJobId',
  RESERVE : 'jh_reserve',
  RESET : 'jh_reset',
  BITNODE : 'jh_bn_multipliers',
  SOURCEFILES : 'jh_owned_sourcefiles',
  WORKING : 'jh_working',
  DECOMMISSIONED : 'jh_decommissioned',
  HACKPERCENT : 'jh_hack_percent',
  CLASHTIME : 'jh_next_territory_warefare',
  GANGMETA : 'jh_gang_information',
  SLEEVEMETA : 'jh_sleeve_information',
}

export const myFavTheme = {
  "primarylight": "#AED1B5",
  "primary": "#80AA89",
  "primarydark": "#6C7E70",
  "successlight": "#68D680",
  "success": "#47AC5D",
  "successdark": "#3A7145",
  "errorlight": "#EF5757",
  "error": "#CC3D3D",
  "errordark": "#AA4B4B",
  "secondarylight": "#AFAFAF",
  "secondary": "#7C817E",
  "secondarydark": "#5A5A5A",
  "warninglight": "#DFDF5D",
  "warning": "#C3C346",
  "warningdark": "#9A9A42",
  "infolight": "#69f",
  "info": "#36c",
  "infodark": "#039",
  "welllight": "#444",
  "well": "#222",
  "white": "#fff",
  "black": "#000",
  "hp": "#dd3434",
  "money": "#FFE347",
  "hack": "#adff2f",
  "combat": "#faffdf",
  "cha": "#a671d1",
  "int": "#6495ed",
  "rep": "#faffdf",
  "disabled": "#605C5C",
  "backgroundprimary": "#121217",
  "backgroundsecondary": "#060607",
  "button": "#333",
  "maplocation": "#ffffff",
  "bnlvl0": "#ffff00",
  "bnlvl1": "#ff0000",
  "bnlvl2": "#48d1cc",
  "bnlvl3": "#0000ff"
}
