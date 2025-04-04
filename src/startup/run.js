import {
        disableLogs,
        getNsDataThroughFile as fetch,
        setLSItem,
        clearLSItem,
      } from 'helpers.js'

const staleLocalStorageKeys = [
  'nmap',
  'reserve',
  'reset',
  'player',
  'decommissioned',
  'hackpercent',
  'clashtime',
  'gangmeta',
  'sleevemeta',
]

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ["sleep"])
  ns.print("--------------------------------------")

  ns.tprint(`Cleaning up localStorage.`)
  staleLocalStorageKeys.map((value) => clearLSItem(value))
  await ns.sleep(20)

  ns.tprint(`Fetching reset info`)
  const reset = await fetch(ns, `ns.getResetInfo()`, '/Temp/reset-info.txt')
  setLSItem('reset', reset)
  await ns.sleep(100)

  var bn;
  if (reset.currentNode == 5 || reset.ownedSF.get(5)) {
    ns.tprint(`Fetching bitnode multipliers`)
    bn = await fetch(ns, `ns.getBitNodeMultipliers()`, '/Temp/bitnode.txt')
  } else {
    if (reset.currentNode == 1) {
      ns.tprint(`Setting Bitnode 1 multipliers`)
    } else {
      ns.tprint(`WARNING: Assuming Bitnode 1 multipliers - these are wrong!`)
    }
    bn = {"AgilityLevelMultiplier":1,"AugmentationMoneyCost":1,"AugmentationRepCost":1,"BladeburnerRank":1,
          "BladeburnerSkillCost":1,"CharismaLevelMultiplier":1,"ClassGymExpGain":1,"CodingContractMoney":1,
          "CompanyWorkExpGain":1,"CompanyWorkMoney":1,"CompanyWorkRepGain":1,"CorporationDivisions":1,
          "CorporationSoftcap":1,"CorporationValuation":1,"CrimeExpGain":1,"CrimeMoney":1,
          "CrimeSuccessRate":1,"DaedalusAugsRequirement":1,"DefenseLevelMultiplier":1,
          "DexterityLevelMultiplier":1,"FactionPassiveRepGain":1,"FactionWorkExpGain":1,
          "FactionWorkRepGain":1,"FourSigmaMarketDataApiCost":1,"FourSigmaMarketDataCost":1,
          "GangSoftcap":1,"GangUniqueAugs":1,"GoPower":1,"HackExpGain":1,"HackingLevelMultiplier":1,
          "HackingSpeedMultiplier":1,"HacknetNodeMoney":1,"HomeComputerRamCost":1,
          "InfiltrationMoney":1,"InfiltrationRep":1,"ManualHackMoney":1,"PurchasedServerCost":1,
          "PurchasedServerSoftcap":1,"PurchasedServerLimit":1,"PurchasedServerMaxRam":1,
          "RepToDonateToFaction":1,"ScriptHackMoney":1,"ScriptHackMoneyGain":1,
          "ServerGrowthRate":1,"ServerMaxMoney":1,"ServerStartingMoney":1,
          "ServerStartingSecurity":1,"ServerWeakenRate":1,"StrengthLevelMultiplier":1,
          "StaneksGiftPowerMultiplier":1,"StaneksGiftExtraSize":1,"WorldDaemonDifficulty":1}
  }
  setLSItem('bitnode', bn)
  await ns.sleep(10)

  ns.tprint(`Setting source file information`)
  const sf = reset.ownedSF
  setLSItem('sourceFiles', sf)
  await ns.sleep(10)

  ns.tprint(`Initializing the Player data`)
  const player = await fetch(ns, `ns.getPlayer()`, '/Temp/getPlayer.txt')
  setLSItem('player', player)
  await ns.sleep(10)

  ns.tprint(`Initializing the Network Map`)
  ns.run('networkMapper.js')
  await ns.sleep(100)

  ns.tprint(`Starting controller.js`)
  ns.run('/satellites/controller.js')
  ns.tprint(`Startup completed. May your pillow always be cool.`)
}
