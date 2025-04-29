// Drop-in replacement class for ns.formulas.
// source: https://github.com/d0sboots/bitburner/blob/main/lib/formulas.js
// Useful if you're poor/early-game.
// There are a few extra utilities relating to BN multipliers at the top-level. (getBitnodeMultipliers(),
// defaultBitnodeMultipliers, etc.) There are also extra functions in Formulas.extra, these mostly duplicate
// functionality found elsewhere (like top-level ns functions) that can be directly calculated without
// needing `ns` or RAM.
//
// Generally you create the class with `createCurrentFormulas(ns)`, but there is also
// `new Formulas(bnMultipliers)` for customizing the BN multipliers if you want.
//
// Implementations are directly copied from the source. Current as of 935ac61 (2024-08-02)

/**
 * @param {NS} ns
 * @return {Formulas}
 *
 * The primary way to create the class.
 * RAM cost: 1.1GB
 * (ns.getResetInfo() + ns.getServerRequiredHackingLevel()).
 */
export function createCurrentFormulas(ns) {
  ns.getResetInfo;
  ns.getServerRequiredHackingLevel;
  return createCurrentFormulasNoRam(ns);
}

/**
 * @param {NS} ns
 * @return {Formulas}
 *
 * The same as createCurrentFormulas, but without the static RAM cost, for RAM dodging.
 * RAM cost: 1.0GB + 0.1GB in BN12
 * (ns.getResetInfo() + ns.getServerRequiredHackingLevel()).
 */
export function createCurrentFormulasNoRam(ns) {
  const currentBn = ns["getResetInfo"]().currentNode;
  const currentSf = currentBn === 12 ? getBn12SfLevelNoRam(ns) : 0;
  return new Formulas(getBitnodeMultipliers(currentBn, currentSf));
}

/**
 * @param {NS} ns
 * @return {number} The sourcefile of the current node, which must be BN12
 *
 * Measures the current level of BN12 by checking the w0r1d_d43m0n difficulty.
 * RAM cost: 0.1GB (ns.getServerRequiredHackingLevel())
 */
export function getBn12SfLevel(ns) {
  ns.getServerRequiredHackingLevel;
  return getBn12SfLevelNoRam(ns);
}

/**
 * @param {NS} ns
 * @return {number} The sourcefile of the current node, which must be BN12
 *
 * The same as getBn12SfLevel, but without the static RAM cost, for RAM dodging.
 * RAM cost: 0.1GB (ns.getServerRequiredHackingLevel())
 */
export function getBn12SfLevelNoRam(ns) {
  const difficulty = ns["getServerRequiredHackingLevel"]("w0r1d_d43m0n");
  // The constant is the fully precise value of log(1.02). (For technical
  // numerical reasons, JS itself can't give us the correct value, since there
  // are numerous "correct" values).
  const levels = Math.log(difficulty) / 0.019802627296179712;
  const rounded = Math.round(levels);
  if (rounded < 1 || Math.abs(levels - rounded) > 0.00000000001) {
    ns.tprintf("WARNING: Called getBn12SfLevel while not in BN12!");
    return -1;
  }
  // BN12 adds 1 to the value, we have to subtract to get the actual SF level.
  // I.e. BN12.1 has an SF level of 0, but starts with 1 level of modifier.
  return rounded - 1;
}

//
// From here on, no functions take `ns` as an argument, and thus nothing costs RAM.
//

/**
 * Bitnode multipliers influence the difficulty of different aspects of the game.
 * Each Bitnode has a different theme/strategy to achieving the end goal, so these multipliers will can help drive the
 * player toward the intended strategy. Unless they really want to play the long, slow game of waiting...
 */
export class BitNodeMultipliers {
  /** Influences how quickly the player's agility level (not exp) scales */
  AgilityLevelMultiplier = 1;

  /** Influences the base cost to purchase an augmentation. */
  AugmentationMoneyCost = 1;

  /** Influences the base rep the player must have with a faction to purchase an augmentation. */
  AugmentationRepCost = 1;

  /** Influences how quickly the player can gain rank within Bladeburner. */
  BladeburnerRank = 1;

  /** Influences the cost of skill levels from Bladeburner. */
  BladeburnerSkillCost = 1;

  /** Influences how quickly the player's charisma level (not exp) scales */
  CharismaLevelMultiplier = 1;

  /** Influences the experience gained for each ability when a player completes a class. */
  ClassGymExpGain = 1;

  /**Influences the amount of money gained from completing Coding Contracts. */
  CodingContractMoney = 1;

  /** Influences the experience gained for each ability when the player completes working their job. */
  CompanyWorkExpGain = 1;

  /** Influences how much money the player earns when completing working their job. */
  CompanyWorkMoney = 1;

  /** Influences how much rep the player gains when performing work for a company. */
  CompanyWorkRepGain = 1;

  /** Influences the valuation of corporations created by the player. */
  CorporationValuation = 1;

  /** Influences the base experience gained for each ability when the player commits a crime. */
  CrimeExpGain = 1;

  /** Influences the base money gained when the player commits a crime. */
  CrimeMoney = 1;

  /** influences the success chance of committing crimes */
  CrimeSuccessRate = 1;

  /** Influences how many Augmentations you need in order to get invited to the Daedalus faction */
  DaedalusAugsRequirement = 30;

  /** Influences how quickly the player's defense level (not exp) scales */
  DefenseLevelMultiplier = 1;

  /** Influences how quickly the player's dexterity level (not exp) scales */
  DexterityLevelMultiplier = 1;

  /** Influences how much rep the player gains in each faction simply by being a member. */
  FactionPassiveRepGain = 1;

  /** Influences the experience gained for each ability when the player completes work for a Faction. */
  FactionWorkExpGain = 1;

  /** Influences how much rep the player gains when performing work for a faction. */
  FactionWorkRepGain = 1;

  /** Influences how much it costs to unlock the stock market's 4S Market Data API */
  FourSigmaMarketDataApiCost = 1;

  /** Influences how much it costs to unlock the stock market's 4S Market Data (NOT API) */
  FourSigmaMarketDataCost = 1;

  /** Reduces gangs earning. */
  GangSoftcap = 1;

  /** Percentage of unique augs that the gang has. */
  GangUniqueAugs = 1;

  /** Percentage multiplier on the effect of the IPvGO rewards  **/
  GoPower = 1;

  /** Influences the experienced gained when hacking a server. */
  HackExpGain = 1;

  /** Influences how quickly the player's hacking level (not experience) scales */
  HackingLevelMultiplier = 1;

  /** Influences how quickly the player's hack(), grow() and weaken() calls run */
  HackingSpeedMultiplier = 1;

  /**
   * Influences how much money is produced by Hacknet Nodes.
   * Influences the hash rate of Hacknet Servers (unlocked in BitNode-9)
   */
  HacknetNodeMoney = 1;

  /** Influences how much money it costs to upgrade your home computer's RAM */
  HomeComputerRamCost = 1;

  /** Influences how much money is gained when the player infiltrates a company. */
  InfiltrationMoney = 1;

  /** Influences how much rep the player can gain from factions when selling stolen documents and secrets */
  InfiltrationRep = 1;

  /**
   * Influences how much money can be stolen from a server when the player performs a hack against it through
   * the Terminal.
   */
  ManualHackMoney = 1;

  /** Influence how much it costs to purchase a server */
  PurchasedServerCost = 1;

  /** Influence how much it costs to purchase a server */
  PurchasedServerSoftcap = 1;

  /** Influences the maximum number of purchased servers you can have */
  PurchasedServerLimit = 1;

  /** Influences the maximum allowed RAM for a purchased server */
  PurchasedServerMaxRam = 1;

  /** Influences the minimum favor the player must have with a faction before they can donate to gain rep. */
  RepToDonateToFaction = 1;

  /** Influences how much money can be stolen from a server when a script performs a hack against it. */
  ScriptHackMoney = 1;

  /**
   * The amount of money actually gained when script hack a server. This is
   * different than the above because you can reduce the amount of money but
   * not gain that same amount.
   */
  ScriptHackMoneyGain = 1;

  /** Influences the growth percentage per cycle against a server. */
  ServerGrowthRate = 1;

  /** Influences the maximum money that a server can grow to. */
  ServerMaxMoney = 1;

  /** Influences the initial money that a server starts with. */
  ServerStartingMoney = 1;

  /** Influences the initial security level (hackDifficulty) of a server. */
  ServerStartingSecurity = 1;

  /** Influences the weaken amount per invocation against a server. */
  ServerWeakenRate = 1;

  /** Influences how quickly the player's strength level (not exp) scales */
  StrengthLevelMultiplier = 1;

  /** Influences the power of the gift. */
  StaneksGiftPowerMultiplier = 1;

  /** Influences the size of the gift. */
  StaneksGiftExtraSize = 0;

  /** Influences the hacking skill required to backdoor the world daemon. */
  WorldDaemonDifficulty = 1;

  /** Influences profits from corporation dividends and selling shares. */
  CorporationSoftcap = 1;

  /** Influences the amount of divisions a corporation can have have at the same time*/
  CorporationDivisions = 1;

  constructor(a = {}) {
    for (const [key, value] of Object.entries(a)) this[key] = clampNumber(value);
  }
}

export const defaultBitnodeMultipliers = new BitNodeMultipliers();
Object.freeze(defaultBitnodeMultipliers);

/**
 * @param {number} bn
 * @param {number} sf Only matters for BN12, this is the *current* SF level (starts at 0)
 * @return {BitNodeMultipliers} The BN mults for the given BN and SF level
 *
 * These are copied directly from the game.
 */
export function getBitnodeMultipliers(bn, sf) {
  sf++; // Adjust for source-file offset that happens elsewhere in the game code
  switch (bn) {
    case 1: {
      return new BitNodeMultipliers();
    }
    case 2: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.8,

        ServerGrowthRate: 0.8,
        ServerMaxMoney: 0.08,
        ServerStartingMoney: 0.4,

        PurchasedServerSoftcap: 1.3,

        CrimeMoney: 3,

        FactionPassiveRepGain: 0,
        FactionWorkRepGain: 0.5,

        CorporationSoftcap: 0.9,
        CorporationDivisions: 0.9,

        InfiltrationMoney: 3,
        StaneksGiftPowerMultiplier: 2,
        StaneksGiftExtraSize: -6,
        WorldDaemonDifficulty: 5,
      });
    }
    case 3: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.8,

        ServerGrowthRate: 0.2,
        ServerMaxMoney: 0.04,
        ServerStartingMoney: 0.2,

        HomeComputerRamCost: 1.5,

        PurchasedServerCost: 2,
        PurchasedServerSoftcap: 1.3,

        CompanyWorkMoney: 0.25,
        CrimeMoney: 0.25,
        HacknetNodeMoney: 0.25,
        ScriptHackMoney: 0.2,

        RepToDonateToFaction: 0.5,

        AugmentationMoneyCost: 3,
        AugmentationRepCost: 3,

        GangSoftcap: 0.9,
        GangUniqueAugs: 0.5,

        StaneksGiftPowerMultiplier: 0.75,
        StaneksGiftExtraSize: -2,

        WorldDaemonDifficulty: 2,
      });
    }
    case 4: {
      return new BitNodeMultipliers({
        ServerMaxMoney: 0.1125,
        ServerStartingMoney: 0.75,

        PurchasedServerSoftcap: 1.2,

        CompanyWorkMoney: 0.1,
        CrimeMoney: 0.2,
        HacknetNodeMoney: 0.05,
        ScriptHackMoney: 0.2,

        ClassGymExpGain: 0.5,
        CompanyWorkExpGain: 0.5,
        CrimeExpGain: 0.5,
        FactionWorkExpGain: 0.5,
        HackExpGain: 0.4,

        FactionWorkRepGain: 0.75,

        GangUniqueAugs: 0.5,

        StaneksGiftPowerMultiplier: 1.5,
        StaneksGiftExtraSize: 0,

        WorldDaemonDifficulty: 3,
      });
    }
    case 5: {
      return new BitNodeMultipliers({
        ServerStartingSecurity: 2,
        ServerStartingMoney: 0.5,

        PurchasedServerSoftcap: 1.2,

        CrimeMoney: 0.5,
        HacknetNodeMoney: 0.2,
        ScriptHackMoney: 0.15,

        HackExpGain: 0.5,

        AugmentationMoneyCost: 2,

        InfiltrationMoney: 1.5,
        InfiltrationRep: 1.5,

        CorporationValuation: 0.75,
        CorporationDivisions: 0.75,

        GangUniqueAugs: 0.5,

        StaneksGiftPowerMultiplier: 1.3,
        StaneksGiftExtraSize: 0,

        WorldDaemonDifficulty: 1.5,
      });
    }
    case 6: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.35,

        ServerMaxMoney: 0.2,
        ServerStartingMoney: 0.5,
        ServerStartingSecurity: 1.5,

        PurchasedServerSoftcap: 2,

        CompanyWorkMoney: 0.5,
        CrimeMoney: 0.75,
        HacknetNodeMoney: 0.2,
        ScriptHackMoney: 0.75,

        HackExpGain: 0.25,

        InfiltrationMoney: 0.75,

        CorporationValuation: 0.2,
        CorporationSoftcap: 0.9,
        CorporationDivisions: 0.8,

        GangSoftcap: 0.7,
        GangUniqueAugs: 0.2,

        DaedalusAugsRequirement: 35,

        StaneksGiftPowerMultiplier: 0.5,
        StaneksGiftExtraSize: 2,

        WorldDaemonDifficulty: 2,
      });
    }
    case 7: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.35,

        ServerMaxMoney: 0.2,
        ServerStartingMoney: 0.5,
        ServerStartingSecurity: 1.5,

        PurchasedServerSoftcap: 2,

        CompanyWorkMoney: 0.5,
        CrimeMoney: 0.75,
        HacknetNodeMoney: 0.2,
        ScriptHackMoney: 0.5,

        HackExpGain: 0.25,

        AugmentationMoneyCost: 3,

        InfiltrationMoney: 0.75,

        FourSigmaMarketDataCost: 2,
        FourSigmaMarketDataApiCost: 2,

        CorporationValuation: 0.2,
        CorporationSoftcap: 0.9,
        CorporationDivisions: 0.8,

        BladeburnerRank: 0.6,
        BladeburnerSkillCost: 2,

        GangSoftcap: 0.7,
        GangUniqueAugs: 0.2,

        DaedalusAugsRequirement: 35,

        StaneksGiftPowerMultiplier: 0.9,
        StaneksGiftExtraSize: -1,

        WorldDaemonDifficulty: 2,
      });
    }
    case 8: {
      return new BitNodeMultipliers({
        PurchasedServerSoftcap: 4,

        CompanyWorkMoney: 0,
        CrimeMoney: 0,
        HacknetNodeMoney: 0,
        ManualHackMoney: 0,
        ScriptHackMoney: 0.3,
        ScriptHackMoneyGain: 0,
        CodingContractMoney: 0,

        RepToDonateToFaction: 0,

        InfiltrationMoney: 0,

        CorporationValuation: 0,
        CorporationSoftcap: 0,
        CorporationDivisions: 0,

        BladeburnerRank: 0,

        GangSoftcap: 0,
        GangUniqueAugs: 0,

        StaneksGiftExtraSize: -99,
      });
    }
    case 9: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.5,
        StrengthLevelMultiplier: 0.45,
        DefenseLevelMultiplier: 0.45,
        DexterityLevelMultiplier: 0.45,
        AgilityLevelMultiplier: 0.45,
        CharismaLevelMultiplier: 0.45,

        ServerMaxMoney: 0.01,
        ServerStartingMoney: 0.1,
        ServerStartingSecurity: 2.5,

        HomeComputerRamCost: 5,

        PurchasedServerLimit: 0,

        CrimeMoney: 0.5,
        ScriptHackMoney: 0.1,

        HackExpGain: 0.05,

        FourSigmaMarketDataCost: 5,
        FourSigmaMarketDataApiCost: 4,

        CorporationValuation: 0.5,
        CorporationSoftcap: 0.75,
        CorporationDivisions: 0.8,

        BladeburnerRank: 0.9,
        BladeburnerSkillCost: 1.2,

        GangSoftcap: 0.8,
        GangUniqueAugs: 0.25,

        StaneksGiftPowerMultiplier: 0.5,
        StaneksGiftExtraSize: 2,

        WorldDaemonDifficulty: 2,
      });
    }
    case 10: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.35,
        StrengthLevelMultiplier: 0.4,
        DefenseLevelMultiplier: 0.4,
        DexterityLevelMultiplier: 0.4,
        AgilityLevelMultiplier: 0.4,
        CharismaLevelMultiplier: 0.4,

        HomeComputerRamCost: 1.5,

        PurchasedServerCost: 5,
        PurchasedServerSoftcap: 1.1,
        PurchasedServerLimit: 0.6,
        PurchasedServerMaxRam: 0.5,

        CompanyWorkMoney: 0.5,
        CrimeMoney: 0.5,
        HacknetNodeMoney: 0.5,
        ManualHackMoney: 0.5,
        ScriptHackMoney: 0.5,
        CodingContractMoney: 0.5,

        AugmentationMoneyCost: 5,
        AugmentationRepCost: 2,

        InfiltrationMoney: 0.5,

        CorporationValuation: 0.5,
        CorporationSoftcap: 0.9,
        CorporationDivisions: 0.9,

        BladeburnerRank: 0.8,

        GangSoftcap: 0.9,
        GangUniqueAugs: 0.25,

        StaneksGiftPowerMultiplier: 0.75,
        StaneksGiftExtraSize: -3,

        WorldDaemonDifficulty: 2,
      });
    }
    case 11: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.6,

        ServerGrowthRate: 0.2,
        ServerMaxMoney: 0.01,
        ServerStartingMoney: 0.1,
        ServerWeakenRate: 2,

        PurchasedServerSoftcap: 2,

        CompanyWorkMoney: 0.5,
        CrimeMoney: 3,
        HacknetNodeMoney: 0.1,
        CodingContractMoney: 0.25,

        HackExpGain: 0.5,

        AugmentationMoneyCost: 2,

        InfiltrationMoney: 2.5,
        InfiltrationRep: 2.5,

        FourSigmaMarketDataCost: 4,
        FourSigmaMarketDataApiCost: 4,

        CorporationValuation: 0.1,
        CorporationSoftcap: 0.9,
        CorporationDivisions: 0.9,

        GangUniqueAugs: 0.75,

        WorldDaemonDifficulty: 1.5,
      });
    }
    case 12: {
      const inc = Math.pow(1.02, sf);
      const dec = 1 / inc;

      return new BitNodeMultipliers({
        DaedalusAugsRequirement: Math.floor(Math.min(defaultBitnodeMultipliers.DaedalusAugsRequirement + inc, 40)),

        HackingLevelMultiplier: dec,
        StrengthLevelMultiplier: dec,
        DefenseLevelMultiplier: dec,
        DexterityLevelMultiplier: dec,
        AgilityLevelMultiplier: dec,
        CharismaLevelMultiplier: dec,

        ServerGrowthRate: dec,
        ServerMaxMoney: dec * dec,
        ServerStartingMoney: dec,
        ServerWeakenRate: dec,

        //Does not scale, otherwise security might start at 300+
        ServerStartingSecurity: 1.5,

        HomeComputerRamCost: inc,

        PurchasedServerCost: inc,
        PurchasedServerSoftcap: inc,
        PurchasedServerLimit: dec,
        PurchasedServerMaxRam: dec,

        CompanyWorkMoney: dec,
        CrimeMoney: dec,
        HacknetNodeMoney: dec,
        ManualHackMoney: dec,
        ScriptHackMoney: dec,
        CodingContractMoney: dec,

        ClassGymExpGain: dec,
        CompanyWorkExpGain: dec,
        CrimeExpGain: dec,
        FactionWorkExpGain: dec,
        HackExpGain: dec,

        FactionPassiveRepGain: dec,
        FactionWorkRepGain: dec,
        RepToDonateToFaction: inc,

        AugmentationMoneyCost: inc,
        AugmentationRepCost: inc,

        InfiltrationMoney: dec,
        InfiltrationRep: dec,

        FourSigmaMarketDataCost: inc,
        FourSigmaMarketDataApiCost: inc,

        CorporationValuation: dec,
        CorporationSoftcap: 0.8,
        CorporationDivisions: 0.5,

        BladeburnerRank: dec,
        BladeburnerSkillCost: inc,

        GangSoftcap: 0.8,
        GangUniqueAugs: dec,

        StaneksGiftPowerMultiplier: inc,
        StaneksGiftExtraSize: inc,

        WorldDaemonDifficulty: inc,
      });
    }
    case 13: {
      return new BitNodeMultipliers({
        HackingLevelMultiplier: 0.25,
        StrengthLevelMultiplier: 0.7,
        DefenseLevelMultiplier: 0.7,
        DexterityLevelMultiplier: 0.7,
        AgilityLevelMultiplier: 0.7,

        PurchasedServerSoftcap: 1.6,

        ServerMaxMoney: 0.3375,
        ServerStartingMoney: 0.75,
        ServerStartingSecurity: 3,

        CompanyWorkMoney: 0.4,
        CrimeMoney: 0.4,
        HacknetNodeMoney: 0.4,
        ScriptHackMoney: 0.2,
        CodingContractMoney: 0.4,

        ClassGymExpGain: 0.5,
        CompanyWorkExpGain: 0.5,
        CrimeExpGain: 0.5,
        FactionWorkExpGain: 0.5,
        HackExpGain: 0.1,

        FactionWorkRepGain: 0.6,

        FourSigmaMarketDataCost: 10,
        FourSigmaMarketDataApiCost: 10,

        CorporationValuation: 0.001,
        CorporationSoftcap: 0.4,
        CorporationDivisions: 0.4,

        BladeburnerRank: 0.45,
        BladeburnerSkillCost: 2,

        GangSoftcap: 0.3,
        GangUniqueAugs: 0.1,

        StaneksGiftPowerMultiplier: 2,
        StaneksGiftExtraSize: 1,

        WorldDaemonDifficulty: 3,
      });
    }
    case 14: {
      return new BitNodeMultipliers({
        GoPower: 4,

        HackingLevelMultiplier: 0.4,
        HackingSpeedMultiplier: 0.3,

        ServerMaxMoney: 0.7,
        ServerStartingMoney: 0.5,
        ServerStartingSecurity: 1.5,

        CrimeMoney: 0.75,
        CrimeSuccessRate: 0.4,
        HacknetNodeMoney: 0.25,
        ScriptHackMoney: 0.3,

        StrengthLevelMultiplier: 0.5,
        DexterityLevelMultiplier: 0.5,
        AgilityLevelMultiplier: 0.5,

        AugmentationMoneyCost: 1.5,

        InfiltrationMoney: 0.75,

        FactionWorkRepGain: 0.2,
        CompanyWorkRepGain: 0.2,

        CorporationValuation: 0.4,
        CorporationSoftcap: 0.9,
        CorporationDivisions: 0.8,

        BladeburnerRank: 0.6,
        BladeburnerSkillCost: 2,

        GangSoftcap: 0.7,
        GangUniqueAugs: 0.4,

        StaneksGiftPowerMultiplier: 0.5,
        StaneksGiftExtraSize: -1,

        WorldDaemonDifficulty: 5,
      });
    }
    default: {
      throw new Error(`Invalid bn: ${bn}`);
    }
  }
}

/**
 * The main class. Contains all formula-replacement functions and subclasses.
 */
export class Formulas {
  // These sub-classes are initialized in the constructor
  extra;
  reputation;
  skills;
  hacking;
  hacknetNodes;
  hacknetServers;
  gang;
  work;

  /**
   * @param {BitNodeMultipliers} bnMults
   */
  constructor(bnMults) {
    if (bnMults === null || typeof bnMults !== "object" || !("ScriptHackMoney" in bnMults)) {
      throw new Error(`bnMults is not a valid BN mults object: ${bnMults}`);
    }
    this.extra = new Extra(bnMults);
    this.reputation = new Reputation(bnMults);
    this.skills = new Skills(bnMults);
    this.hacking = new Hacking(bnMults, this.extra);
    this.hacknetNodes = new HacknetNodes();
    this.hacknetServers = new HacknetServers();
    this.gang = new Gang();
    this.work = new Work();
  }

  mockServer() {
    return {
      cpuCores: 0,
      ftpPortOpen: false,
      hasAdminRights: false,
      hostname: "",
      httpPortOpen: false,
      ip: "",
      isConnectedTo: false,
      maxRam: 0,
      organizationName: "",
      ramUsed: 0,
      smtpPortOpen: false,
      sqlPortOpen: false,
      sshPortOpen: false,
      purchasedByPlayer: false,
      backdoorInstalled: false,
      baseDifficulty: 0,
      hackDifficulty: 0,
      minDifficulty: 0,
      moneyAvailable: 0,
      moneyMax: 0,
      numOpenPortsRequired: 0,
      openPortCount: 0,
      requiredHackingSkill: 0,
      serverGrowth: 0,
    };
  }

  mockPlayer() {
    return {
      // Person
      hp: { current: 0, max: 0 },
      skills: { hacking: 0, strength: 0, defense: 0, dexterity: 0, agility: 0, charisma: 0, intelligence: 0 },
      exp: { hacking: 0, strength: 0, defense: 0, dexterity: 0, agility: 0, charisma: 0, intelligence: 0 },
      mults: defaultMultipliers(),
      city: CityName.Sector12,
      // Player-specific
      numPeopleKilled: 0,
      money: 0,
      location: LocationName.TravelAgency,
      totalPlaytime: 0,
      jobs: {},
      factions: [],
      entropy: 0,
      karma: 0,
    };
  }

  mockPerson() {
    return {
      hp: { current: 0, max: 0 },
      skills: { hacking: 0, strength: 0, defense: 0, dexterity: 0, agility: 0, charisma: 0, intelligence: 0 },
      exp: { hacking: 0, strength: 0, defense: 0, dexterity: 0, agility: 0, charisma: 0, intelligence: 0 },
      mults: defaultMultipliers(),
      city: CityName.Sector12,
    };
  }
}

/** Equivalent of formulas.reputation */
class Reputation {
  bnMults;

  /**
   * @param {BitNodeMultipliers} bnMults
   */
  constructor(bnMults) {
    this.bnMults = bnMults;
  }

  calculateFavorToRep(_favor) {
    const favor = helpers.number("favor", _favor);
    const raw = 25000 * (Math.pow(1.02, favor) - 1);
    return Math.round(raw * 10000) / 10000; // round to make things easier.
  }

  calculateRepToFavor(_rep) {
    const rep = helpers.number("rep", _rep);
    const raw = Math.log(rep / 25000 + 1) / Math.log(1.02);
    return Math.round(raw * 10000) / 10000; // round to make things easier.
  }

  repFromDonation(_amount, _player) {
    const amount = helpers.number("amount", _amount);
    const person = helpers.person(_player);
    return (amount / CONSTANTS.DonateMoneyToRepDivisor) * person.mults.faction_rep * this.bnMults.FactionWorkRepGain;
  }
}

/** Equivalent of formulas.skills */
class Skills {
  bnMults;

  /**
   * @param {BitNodeMultipliers} bnMults
   */
  constructor(bnMults) {
    this.bnMults = bnMults;
  }

  calculateSkill(_exp, _mult = 1) {
    const exp = helpers.number("exp", _exp);
    const mult = helpers.number("mult", _mult);
    return Math.max(Math.floor(mult * (32 * Math.log(exp + 534.6) - 200)), 1);
  }

  calculateExp(_skill, _mult = 1) {
    const skill = helpers.number("skill", _skill);
    const mult = helpers.number("mult", _mult);
    return Math.exp((skill / mult + 200) / 32) - 534.6;
  }
}

/** Equivalent of formulas.hacking */
class Hacking {
  bnMults;
  extra;

  /**
   * @param {BitNodeMultipliers} bnMults
   */
  constructor(bnMults, extra) {
    this.bnMults = bnMults;
    this.extra = extra;
  }

  hackChance(_server, _player) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    const hackDifficulty = server.hackDifficulty ?? 100;
    const requiredHackingSkill = server.requiredHackingSkill ?? 1e9;
    // Unrooted or unhackable server
    if (!server.hasAdminRights || hackDifficulty >= 100) return 0;
    const hackFactor = 1.75;
    const difficultyMult = (100 - hackDifficulty) / 100;
    const skillMult = hackFactor * person.skills.hacking;
    const skillChance = (skillMult - requiredHackingSkill) / skillMult;
    const chance =
      skillChance *
      difficultyMult *
      person.mults.hacking_chance *
      calculateIntelligenceBonus(person.skills.intelligence, 1);
    return Math.min(1, Math.max(chance, 0));
  }

  hackExp(_server, _player) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);

    const baseDifficulty = server.baseDifficulty;
    if (!baseDifficulty) return 0;
    const baseExpGain = 3;
    const diffFactor = 0.3;
    let expGain = baseExpGain;
    expGain += baseDifficulty * diffFactor;
    return expGain * person.mults.hacking_exp * this.bnMults.HackExpGain;
  }

  hackPercent(_server, _player) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);

    return this.extra.calculatePercentMoneyHacked(server, person);
  }

  /* TODO 2.3: Remove growPercent, add growMultiplier function?
    Much better name given the output. Not sure if removedFunction error dialog/editing script will be too annoying.
    Changing the function name also allows reordering params as server, player, etc. like other formulas functions */
  growPercent(_server, _threads, _player, _cores = 1) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    const threads = helpers.number("threads", _threads);
    const cores = helpers.number("cores", _cores);

    return this.extra.calculateServerGrowth(server, threads, person, cores);
  }

  growThreads(_server, _player, _targetMoney, _cores = 1) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    let targetMoney = helpers.number("targetMoney", _targetMoney);
    let startMoney = helpers.number("server.moneyAvailable", server.moneyAvailable);
    const cores = helpers.number("cores", _cores);

    return this.extra.growThreadsFractional(server, person, targetMoney, startMoney, cores, -1);
  }

  growAmount(_server, _player, _threads, _cores = 1) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    const threads = helpers.number("threads", _threads);
    const cores = helpers.number("cores", _cores);

    let serverGrowth = this.extra.calculateServerGrowth(server, threads, person, cores);
    if (serverGrowth < 1) {
      console.warn("serverGrowth calculated to be less than 1");
      serverGrowth = 1;
    }

    let moneyAvailable = server.moneyAvailable ?? Number.NaN;
    moneyAvailable += threads; // It can be grown even if it has no money
    moneyAvailable *= serverGrowth;

    // cap at max (or data corruption)
    if (
      server.moneyMax !== undefined &&
      isValidNumber(server.moneyMax) &&
      (moneyAvailable > server.moneyMax || isNaN(moneyAvailable))
    ) {
      moneyAvailable = server.moneyMax;
    }
    return moneyAvailable;
  }

  hackTime(_server, _player) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    return calculateHackingTime(server, person) * 1000;
  }

  growTime(_server, _player) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    const growTimeMultiplier = 3.2; // Relative to hacking time. 16/5 = 3.2

    return growTimeMultiplier * calculateHackingTime(server, person) * 1000;
  }

  weakenTime(_server, _player) {
    const server = helpers.server(_server);
    const person = helpers.person(_player);
    const weakenTimeMultiplier = 4; // Relative to hacking time

    return weakenTimeMultiplier * calculateHackingTime(server, person) * 1000;
  }
}

/** Equivalent of formulas.hacknetNodes */
class HacknetNodes {}

/** Equivalent of formulas.hacknetServers */
class HacknetServers {}

/** Equivalent of formulas.gang */
class Gang {}

/** Equivalent of formulas.work */
class Work {}

/** Extra functions that calculate useful things. */
class Extra {
  bnMults;

  /**
   * @param {BitNodeMultipliers} bnMults
   */
  constructor(bnMults) {
    this.bnMults = bnMults;
  }

  /**
   * This exists both to be a helper for other functions in Extra, and also as
   * a version of the function that doesn't validate arguments.
   */
  calculatePercentMoneyHacked(server, person) {
    const hackDifficulty = server.hackDifficulty ?? 100;
    if (hackDifficulty >= 100) return 0;
    const requiredHackingSkill = server.requiredHackingSkill ?? 1e9;
    // Adjust if needed for balancing. This is the divisor for the final calculation
    const balanceFactor = 240;

    const difficultyMult = (100 - hackDifficulty) / 100;
    const skillMult = (person.skills.hacking - (requiredHackingSkill - 1)) / person.skills.hacking;
    const percentMoneyHacked =
      (difficultyMult * skillMult * person.mults.hacking_money * this.bnMults.ScriptHackMoney) / balanceFactor;

    return Math.min(1, Math.max(percentMoneyHacked, 0));
  }

  // The parts of calculateServerGrowthLog that don't require taking a log
  calculateGrowthConstant(server, p, cores) {
    if (!server.serverGrowth) return -Infinity;

    //Calculate adjusted server growth rate based on parameters
    const serverGrowthPercentage = server.serverGrowth / 100;
    const serverGrowthPercentageAdjusted = serverGrowthPercentage * this.bnMults.ServerGrowthRate;

    //Apply serverGrowth for the calculated number of growth cycles
    const coreBonus = 1 + (cores - 1) * (1 / 16);
    // It is critical that numServerGrowthCycles (aka threads) is multiplied last,
    // so that it rounds the same way as numCycleForGrowthCorrected.
    return serverGrowthPercentageAdjusted * p.mults.hacking_grow * coreBonus;
  }

  // Returns the log of the growth rate. When passing 1 for threads, this gives a useful constant.
  calculateServerGrowthLog(server, threads, p, cores = 1) {
    if (!server.serverGrowth) return -Infinity;
    const hackDifficulty = server.hackDifficulty ?? 100;

    const c = this.calculateGrowthConstant(server, p, cores);
    const numServerGrowthCycles = Math.max(threads, 0);

    //Get adjusted growth log, which accounts for server security
    //log1p computes log(1+p), it is far more accurate for small values.
    let adjGrowthLog = Math.log1p(CONSTANTS.ServerBaseGrowthIncr / hackDifficulty);
    if (adjGrowthLog >= CONSTANTS.ServerMaxGrowthLog) {
      adjGrowthLog = CONSTANTS.ServerMaxGrowthLog;
    }

    // It is critical that numServerGrowthCycles (aka threads) is multiplied last,
    // so that it rounds the same way as numCycleForGrowthCorrected.
    return adjGrowthLog * c * numServerGrowthCycles;
  }

  calculateServerGrowth(server, threads, p, cores = 1) {
    if (!server.serverGrowth) return 0;
    return Math.exp(this.calculateServerGrowthLog(server, threads, p, cores));
  }

  growThreadsFractional(server, person, targetMoney, startMoney, cores = 1, absError = 1) {
    if (!server.serverGrowth) return Infinity;
    const moneyMax = server.moneyMax ?? 1;
    const doRound = absError < 0;
    if (doRound) absError = -absError;

    if (startMoney < 0) startMoney = 0; // servers "can't" have less than 0 dollars on them
    if (targetMoney > moneyMax) targetMoney = moneyMax; // can't grow a server to more than its moneyMax
    if (targetMoney <= startMoney) return 0; // no growth --> no threads

    const k = this.calculateServerGrowthLog(server, 1, person, cores);
    /* To understand what is done below we need to do some math. I hope the explanation is clear enough.
     * First of, the names will be shortened for ease of manipulation:
     * n:= targetMoney (n for new), o:= startMoney (o for old), k:= calculateServerGrowthLog, x:= threads
     * x is what we are trying to compute.
     *
     * After growing, the money on a server is n = (o + x) * exp(k*x)
     * x appears in an exponent and outside it, this is usually solved using the productLog/lambert's W special function,
     * but it turns out that due to floating-point range issues this approach is *useless* to us, so it will be ignored.
     *
     * Instead, we proceed directly to Newton-Raphson iteration. We first rewrite the equation in
     * log-form, since iterating it this way has faster convergence: log(n) = log(o+x) + k*x.
     * Now our goal is to find the zero of f(x) = log((o+x)/n) + k*x.
     * (Due to the shape of the function, there will be a single zero.)
     *
     * The idea of this method is to take the horizontal position at which the horizontal axis
     * intersects with of the tangent of the function's curve as the next approximation.
     * It is equivalent to treating the curve as a line (it is called a first order approximation)
     * If the current approximation is x then the new approximated value is x - f(x)/f'(x)
     * (where f' is the derivative of f).
     *
     * In our case f(x) = log((o+x)/n) + k*x, f'(x) = d(log((o+x)/n) + k*x)/dx
     *                                              = 1/(o + x) + k
     * And the update step is x[new] = x - (log((o+x)/n) + k*x)/(1/(o+x) + k)
     * We can simplify this by bringing the first term up into the fraction:
     * = (x * (1/(o+x) + k) - log((o+x)/n) - k*x) / (1/(o+x) + k)
     * = (x/(o+x) - log((o+x)/n)) / (1/(o+x) + k)    [multiplying top and bottom by (o+x)]
     * = (x - (o+x)*log((o+x)/n)) / (1 + (o+x)*k)
     *
     * The main question to ask when using this method is "does it converge?"
     * (are the approximations getting better?), if it does then it does quickly.
     * Since the derivative is always positive but also strictly decreasing, convergence is guaranteed.
     * This also provides the useful knowledge that any x which starts *greater* than the solution will
     * undershoot across to the left, while values *smaller* than the zero will continue to find
     * closer approximations that are still smaller than the final value.
     *
     * Of great importance for reducing the number of iterations is starting with a good initial
     * guess. We use a very simple starting condition: x_0 = n - o. We *know* this will always overshot
     * the target, usually by a vast amount. But we can run it manually through one Newton iteration
     * to get a better start with nice properties:
     * x_1 = ((n - o) - (n - o + o)*log((n-o+o)/n)) / (1 + (n-o+o)*k)
     *     = ((n - o) - n * log(n/n)) / (1 + n*k)
     *     = ((n - o) - n * 0) / (1 + n*k)
     *     = (n - o) / (1 + n*k)
     * We can do the same procedure with the exponential form of Newton's method, starting from x_0 = 0.
     * This gives x_1 = (n - o) / (1 + o*k), (full derivation omitted) which will be an overestimate.
     * We use a weighted average of the denominators to get the final guess:
     *   x = (n - o) / (1 + (1/16*n + 15/16*o)*k)
     * The reason for this particular weighting is subtle; it is exactly representable and holds up
     * well under a wide variety of conditions, making it likely that the we start within 1 thread of
     * correct. It particularly bounds the worst-case to 3 iterations, and gives a very wide swatch
     * where 2 iterations is good enough.
     *
     * The accuracy of the initial guess is good for many inputs - often one iteration
     * is sufficient. This means the overall cost is two logs (counting the one in calculateServerGrowthLog),
     * possibly one exp, 5 divisions, and a handful of basic arithmetic.
     */
    const guess = (targetMoney - startMoney) / (1 + (targetMoney * (1 / 16) + startMoney * (15 / 16)) * k);
    let x = guess;
    let diff;
    do {
      const ox = startMoney + x;
      // Have to use division instead of multiplication by inverse, because
      // if targetMoney is MIN_VALUE then inverting gives Infinity
      const newx = (x - ox * Math.log(ox / targetMoney)) / (1 + ox * k);
      diff = newx - x;
      x = newx;
    } while (diff < -absError || diff > absError);
    if (!doRound) {
      return x;
    }
    // If we see a diff of 1 or less we know all future diffs will be smaller, and the rate of
    // convergence means the *sum* of the diffs will be less than 1.
    // In most cases, our result here will be ceil(x).
    const ccycle = Math.ceil(x);
    if (ccycle - x > 0.999999) {
      // Rounding-error path: It's possible that we slightly overshot the integer value due to
      // rounding error, and more specifically precision issues with log and the size difference of
      // startMoney vs. x. See if a smaller integer works. Most of the time, x was not close enough
      // that we need to try.
      const fcycle = ccycle - 1;
      if (targetMoney <= (startMoney + fcycle) * Math.exp(k * fcycle)) {
        return fcycle;
      }
    }
    if (ccycle >= x + ((diff <= 0 ? -diff : diff) + 0.000001)) {
      // Fast-path: We know the true value is somewhere in the range [x, x + |diff|] but the next
      // greatest integer is past this. Since we have to round up grows anyway, we can return this
      // with no more calculation. We need some slop due to rounding errors - we can't fast-path
      // a value that is too small.
      return ccycle;
    }
    if (targetMoney <= (startMoney + ccycle) * Math.exp(k * ccycle)) {
      return ccycle;
    }
    return ccycle + 1;
  }

  /**
   * @typedef BatchThreadsOpts
   * @type {object}
   * @property {string} batchType - "hgw" or "ghw"
   * @property {Server} server - server to use for calculations. moneyMax and minDifficulty are the relevant stats,
   *                             *not* moneyAvailable and hackDifficulty
   * @property {Person} person - the person/player to use for stats
   * @property {number} threadConstant - the constant part of the linear constraint, see below
   * @property {?number} threadMultiplier - the multiplier part of the linear constaint, defaults to 0
   * @property {?number} weak - security decrease to apply between h and g, defaults to 0
   * @property {?number} cores - number of cores used in grow, defaults to 1
   * @property {?number} relError - accuracy termination condition, defaults to 1e-4
   * @property {?number} guess - initial guess, defaults to "something reasonable"
   *
   * @typedef {BatchThreadsResult}
   * @type {object}
   * @property {number} hack - number of calculated hack threads
   * @property {number} grow - number of calculated grow threads
   *
   * @param {BatchThreadsOpts} options
   * @return {BatchThreadsResult} the calculated result object
   *
   * This complicated function is used to solve for the number of needed hack() and grow() threads
   * needed to start a batch, given a linear constraint on the number of hacks and grows. This can
   * be used to solve various scenarios, such as fractional hacks needed for integer grows, or
   * fractional hacks and grows needed for integer weakens.
   *
   * The "batchType" argument specifies the type of the batch, either "hgw" or "ghw". This
   * fundamentally defines the ordering. "hwgw" and "gwhw" batches are also supported via the
   * optional parameter "weaken", which applies an specified amount of security decrease between
   * the hacks and grows. (Note that this is an absolute decrease, not a number of threads.)
   *
   * The fundamental equation that is being solved for in the case of HGW
   * "growThreads = threadMultiplier * hackThreads + threadConstant". For GHW, it is instead
   * "hackThreads = threadMultiplier * growThreads + threadConstant". In other words, it is a linear
   * formula where the dependant variable is the 2nd operation, expressed as a multiplier on the 1st
   * operation.
   *
   * Netwon's method is used to numerically approximate the answer, so a nearby "guess" can reduce
   * the number of iterations, while a smaller "relError" will increase it.
   *
   * Some examples will make this more clear. All of these examples are for HGW.
   * To solve the batch params given that you have 8 grow threads, you would set threadConstant to 8
   * and threadMultiplier to 0. This creates the function "growThreads = 8", and the function will
   * return the number of hack threads needed for a proper batch. Using these numbers, you can
   * easily "solve forward" to get the number of weaken threads.
   *
   * To solve the batch params given that you have 2 weaken threads, you would set threadConstant to 25
   * (25 / 2 weakens/grow * 2 threads), and threadMultiplier to -0.5 (can trade 2 hacks for every grow).
   * This gives the formula "growThreads = 25 - hackThreads / 2". The function will return the
   * number of hack and grow threads needed. The weaken threads have already been given.
   *
   * To solve given that you have 5 hack threads, don't use this function. This function can only
   * give you the threads for the first action, which you already know is 5. Instead, "Solve forward"
   * by calculating the effect of the hacks, determining the necessary grows with growThreadsFractional(),
   * and then determining the needed weakens.
   */
  calculateBatchThreads(options) {
    if (options.batchType !== "hgw" && options.batchType !== "ghw") {
      throw makeRuntimeErrorMsg(`batchType must be hgw or ghw, was ${options.batchType}`);
    }
    const hgw = options.batchType === "hgw";
    // Make a copy of server, because we have to tweak it.
    const server = { ...helpers.server(options.server) };
    const person = helpers.person(options.person);
    const threadConstant = helpers.number("threadConstant", options.threadConstant);
    const threadMultiplier = helpers.number("threadMultiplier", options.threadMultiplier ?? 0);
    const weaken = helpers.number("weaken", options.weak ?? 0);
    const cores = helpers.number("cores", options.cores ?? 1);
    const relError = helpers.number("relError", options.relError ?? 1e-4);
    const guess = helpers.number("guess", options.guess ?? 0);

    if (!server.serverGrowth) {
      throw makeRuntimeErrorMsg(`server ${server.hostname} cannot be grown`);
    }
    if (!server.moneyMax) {
      throw makeRuntimeErrorMsg(`server ${server.hostname} can't store money`);
    }
    if (!server.minDifficulty) {
      throw makeRuntimeErrorMsg(`server ${server.hostname} can't be hacked`);
    }
    // We use minDifficulty for the API, but internally some of our helper
    // functions calculate with hackDifficulty.
    server.hackDifficulty = server.minDifficulty;
    // These formulas use Newton's method to quickly estimate the correct solution to the problem.
    // Common elements of both include using "t" for the answer that we are refining (which starts
    // at "guess"), "newt" is the new value of "t", "diff" is the difference between the current and
    // previous iteration, and "thresh" is the exit threshold, calculated from "t" and "relError".
    // The expression "newt = t - y / yp" is the newton step, computing the new value from "y" (the
    // function value) and "yp" (which is y prime, i.e. the derivative).
    // Other common things in the very bad naming scheme: Variables starting with "c" or "k" are
    // constants used across multiple iterations. "pmh" stands for "percent money hacked."
    //
    // Here is the derivation for the HGW case. The GHW case proceeds similarly, but is also
    // completely different.
    // At the grow step, we have the following formula:
    // (prev_money + g_threads) * exp(log(1 + ServerBaseGrowthIncr/final_difficulty) * c_grow * g_threads) = money
    // Where:
    //  - prev_money is the money after hacking
    //  - g_threads is the (fractional) threads used to grow
    //  - final_difficulty is the security after hacking and "weaken"
    //  - c_grow is a constant collecting all the grow terms that *aren't* security or threads
    //  - money is the final grown money (i.e. moneyMax)
    //
    //  prev_money = money - drain = money - money * c_pmh * h_threads
    //  final_difficulty = minDifficulty + ServerFortifyAmount * h_threads - weaken
    //  g_threads = threadConstant + threadMultiplier * h_threads (by definition above)
    //  Therefore:
    //  (money - money * c_pmh * h_threads + threadConstant + threadMultiplier * h_threads) * exp(
    //    log(1 + ServerBaseGrowthIncr/(minDifficulty + ServerFortifyAmount * h_threads - weaken)) * c_grow * g_threads) = money
    //  1 - h_threads * (c_pmh - threadMultiplier / money) + threadConstant / money = exp(
    //    log1p((ServerBaseGrowthIncr/ServerFortifyAmount)/((minDifficulty-weaken)/ServerFortifyAmount + h_threads)) *
    //    -c_grow * g_threads)
    //
    //  let k1 = ServerBaseGrowthIncr/ServerFortifyAmount and k2 = (minDifficulty - weaken) / ServerFortifyAmount
    //  let t_mult = c_pmh - threadMultiplier / money
    //
    //  0 = exp(log1p(k1/(k2+h_threads)) * -c_grow * g_threads) - 1 + h_threads * t_mult
    //  For Newton's method, y is this function and we want the x-intercept, so:
    //  y = expm1(log1p(k1/(k2+h_threads)) * -c_grow * g_threads) + h_threads * t_mult
    //  I'm not even going to write out calculating the derivative, it is tedious but straightforward.
    if (hgw) {
      const t_mult = this.calculatePercentMoneyHacked(server, person) - threadMultiplier / server.moneyMax;
      const c = threadConstant / server.moneyMax;
      const k1 = 15; // ServerBaseGrowthIncr / ServerFortifyAmount
      const k2 = 500 * (server.minDifficulty - weaken);
      const k3 = k1 + k2;
      const c_grow = -this.calculateGrowthConstant(server, person, cores);
      let t = guess;
      let diff, thresh;
      do {
        const linear = threadConstant + threadMultiplier * t;
        const log_inner = k1 / (k2 + t);
        // A wrinkle: the formula for growth has a conditional based on the security. This causes a discontinuity in the
        // derivative, which theoretically could keep this from converging. But in practice, the shape of our function
        // means it won't be a problem (concave-up papers over many sins).
        const log = log_inner < 0.0035 ? Math.log1p(log_inner) : CONSTANTS.ServerMaxGrowthLog;
        const exp = Math.expm1(c_grow * log * linear);
        const y = exp + t * t_mult - c;
        const yp =
          t_mult +
          c_grow * (exp + 1) * (threadMultiplier * log - (log_inner < 0.0035 ? (log_inner * linear) / (k3 + t) : 0));
        const newt = t - y / yp;
        diff = newt - t;
        thresh = t * relError;
        t = newt;
      } while (diff < -thresh || diff > thresh);
      return { hack: t, grow: threadConstant + threadMultiplier * t };
    } else {
      const c_grow = -this.calculateServerGrowthLog(server, 1, person, cores);
      const requiredHackingSkill = server.requiredHackingSkill ?? 1e9;
      const skillMult = (person.skills.hacking - (requiredHackingSkill - 1)) / person.skills.hacking;
      const c_pmh = (skillMult * person.mults.hacking_money * this.bnMults.ScriptHackMoney) / 6000000;
      const k1 = 25000 - 250 * (server.minDifficulty - weaken);
      const invmon = 1 / server.moneyMax;
      let t = guess;
      let diff, thresh;
      do {
        const linear = threadConstant + threadMultiplier * t;
        const exp = Math.expm1(c_grow * t);
        const pmh = c_pmh * (k1 - t);
        const y = exp + linear * pmh - t * invmon;
        const yp = c_grow * (exp + 1) - linear * c_pmh - invmon + threadMultiplier * pmh;
        const newt = t - y / yp;
        diff = newt - t;
        thresh = t * relError;
        t = newt;
      } while (diff < -thresh || diff > thresh);
      return { grow: t, hack: threadConstant + threadMultiplier * t };
    }
  }
}

const helpers = {
  server(s) {
    const fakeServer = {
      hostname: undefined,
      ip: undefined,
      sshPortOpen: undefined,
      ftpPortOpen: undefined,
      smtpPortOpen: undefined,
      httpPortOpen: undefined,
      sqlPortOpen: undefined,
      hasAdminRights: undefined,
      cpuCores: undefined,
      isConnectedTo: undefined,
      ramUsed: undefined,
      maxRam: undefined,
      organizationName: undefined,
      purchasedByPlayer: undefined,
    };
    const error = missingKey(fakeServer, s);
    if (error) {
      throw makeRuntimeErrorMsg(`server should be a Server.\n${error}`, "TYPE");
    }
    return s;
  },
  number(argName, v) {
    if (typeof v === "string") {
      const x = parseFloat(v);
      if (!isNaN(x)) return x; // otherwise it wasn't even a string representing a number.
    } else if (typeof v === "number") {
      if (isNaN(v)) throw makeRuntimeErrorMsg(`'${argName}' is NaN.`);
      return v;
    }
    throw makeRuntimeErrorMsg(`'${argName}' should be a number. ${debugType(v)}`, "TYPE");
  },
  string(argName, v) {
    if (typeof v === "number") v = v + ""; // cast to string;
    assertString(argName, v);
    return v;
  },
  person(p) {
    const fakePerson = {
      hp: undefined,
      exp: undefined,
      mults: undefined,
      city: undefined,
    };
    const error = missingKey(fakePerson, p);
    if (error) {
      throw makeRuntimeErrorMsg(`person should be a Person.\n${error}`, "TYPE");
    }
    return p;
  },
};

const defaultMultipliers = () => {
  return {
    hacking_chance: 1,
    hacking_speed: 1,
    hacking_money: 1,
    hacking_grow: 1,
    hacking: 1,
    hacking_exp: 1,
    strength: 1,
    strength_exp: 1,
    defense: 1,
    defense_exp: 1,
    dexterity: 1,
    dexterity_exp: 1,
    agility: 1,
    agility_exp: 1,
    charisma: 1,
    charisma_exp: 1,
    hacknet_node_money: 1,
    hacknet_node_purchase_cost: 1,
    hacknet_node_ram_cost: 1,
    hacknet_node_core_cost: 1,
    hacknet_node_level_cost: 1,
    company_rep: 1,
    faction_rep: 1,
    work_money: 1,
    crime_success: 1,
    crime_money: 1,
    bladeburner_max_stamina: 1,
    bladeburner_stamina_gain: 1,
    bladeburner_analysis: 1,
    bladeburner_success_chance: 1,
  };
};

// These enums are accessible from ns, but we don't always *have* an NS object.

/** Names of all cities */
const CityName = {
  Aevum: "Aevum",
  Chongqing: "Chongqing",
  Sector12: "Sector-12",
  NewTokyo: "New Tokyo",
  Ishima: "Ishima",
  Volhaven: "Volhaven",
};

/** Names of all locations */
const LocationName = {
  AevumAeroCorp: "AeroCorp",
  AevumBachmanAndAssociates: "Bachman & Associates",
  AevumClarkeIncorporated: "Clarke Incorporated",
  AevumCrushFitnessGym: "Crush Fitness Gym",
  AevumECorp: "ECorp",
  AevumFulcrumTechnologies: "Fulcrum Technologies",
  AevumGalacticCybersystems: "Galactic Cybersystems",
  AevumNetLinkTechnologies: "NetLink Technologies",
  AevumPolice: "Aevum Police Headquarters",
  AevumRhoConstruction: "Rho Construction",
  AevumSnapFitnessGym: "Snap Fitness Gym",
  AevumSummitUniversity: "Summit University",
  AevumWatchdogSecurity: "Watchdog Security",
  AevumCasino: "Iker Molina Casino",

  ChongqingKuaiGongInternational: "KuaiGong International",
  ChongqingSolarisSpaceSystems: "Solaris Space Systems",
  ChongqingChurchOfTheMachineGod: "Church of the Machine God",

  Sector12AlphaEnterprises: "Alpha Enterprises",
  Sector12BladeIndustries: "Blade Industries",
  Sector12CIA: "Central Intelligence Agency",
  Sector12CarmichaelSecurity: "Carmichael Security",
  Sector12CityHall: "Sector-12 City Hall",
  Sector12DeltaOne: "DeltaOne",
  Sector12FoodNStuff: "FoodNStuff",
  Sector12FourSigma: "Four Sigma",
  Sector12IcarusMicrosystems: "Icarus Microsystems",
  Sector12IronGym: "Iron Gym",
  Sector12JoesGuns: "Joe's Guns",
  Sector12MegaCorp: "MegaCorp",
  Sector12NSA: "National Security Agency",
  Sector12PowerhouseGym: "Powerhouse Gym",
  Sector12RothmanUniversity: "Rothman University",
  Sector12UniversalEnergy: "Universal Energy",

  NewTokyoDefComm: "DefComm",
  NewTokyoGlobalPharmaceuticals: "Global Pharmaceuticals",
  NewTokyoNoodleBar: "Noodle Bar",
  NewTokyoVitaLife: "VitaLife",
  NewTokyoArcade: "Arcade",

  IshimaNovaMedical: "Nova Medical",
  IshimaOmegaSoftware: "Omega Software",
  IshimaStormTechnologies: "Storm Technologies",
  IshimaGlitch: "0x6C1",

  VolhavenCompuTek: "CompuTek",
  VolhavenHeliosLabs: "Helios Labs",
  VolhavenLexoCorp: "LexoCorp",
  VolhavenMilleniumFitnessGym: "Millenium Fitness Gym",
  VolhavenNWO: "NWO",
  VolhavenOmniTekIncorporated: "OmniTek Incorporated",
  VolhavenOmniaCybersystems: "Omnia Cybersystems",
  VolhavenSysCoreSecurities: "SysCore Securities",
  VolhavenZBInstituteOfTechnology: "ZB Institute of Technology",

  Hospital: "Hospital",
  Slums: "The Slums",
  TravelAgency: "Travel Agency",
  WorldStockExchange: "World Stock Exchange",

  Void: "The Void",
};

// Some of these (like version) will get out of date quickly, but they also
// aren't needed for formulas.
const CONSTANTS = {
  VersionString: "2.3.1",
  isDevBranch: true,
  VersionNumber: 31,

  /** Max level for any skill, assuming no multipliers. Determined by max numerical value in javascript for experience
   * and the skill level formula in Player.js. Note that all this means it that when experience hits MAX_INT, then
   * the player will have this level assuming no multipliers. Multipliers can cause skills to go above this.
   */
  MaxSkillLevel: 975,

  // Milliseconds per game cycle
  MilliPerCycle: 200,

  // How much reputation is needed to join a megacorporation's faction
  CorpFactionRepRequirement: 400e3,

  // Base RAM costs
  BaseCostFor1GBOfRamHome: 32000,
  BaseCostFor1GBOfRamServer: 55000, // 1 GB of RAM

  // Cost to travel to another city
  TravelCost: 200e3,

  // Faction and Company favor-related things
  BaseFavorToDonate: 150,
  DonateMoneyToRepDivisor: 1e6,
  FactionReputationToFavorBase: 500,
  FactionReputationToFavorMult: 1.02,
  CompanyReputationToFavorBase: 500,
  CompanyReputationToFavorMult: 1.02,

  // NeuroFlux Governor Augmentation cost multiplier
  NeuroFluxGovernorLevelMult: 1.14,

  NumNetscriptPorts: Number.MAX_SAFE_INTEGER,

  // Server-related constants
  HomeComputerMaxRam: 1073741824, // 2 ^ 30
  ServerBaseGrowthIncr: 0.03, // Unadjusted growth increment (growth rate is this * adjustment + 1)
  ServerMaxGrowthLog: 0.00349388925425578, // Maximum possible growth rate accounting for server security, precomputed as log1p(.0035)
  ServerFortifyAmount: 0.002, // Amount by which server's security increases when its hacked/grown
  ServerWeakenAmount: 0.05, // Amount by which server's security decreases when weakened

  PurchasedServerLimit: 25,
  PurchasedServerMaxRam: 1048576, // 2^20

  // Augmentation Constants
  MultipleAugMultiplier: 1.9,

  // TOR Router
  TorRouterCost: 200e3,

  // Stock market
  WSEAccountCost: 200e6,
  TIXAPICost: 5e9,
  MarketData4SCost: 1e9,
  MarketDataTixApi4SCost: 25e9,
  StockMarketCommission: 100e3,

  // Hospital/Health
  HospitalCostPerHp: 100e3,

  // Intelligence-related constants
  IntelligenceCrimeWeight: 0.025, // Weight for how much int affects crime success rates
  IntelligenceInfiltrationWeight: 0.1, // Weight for how much int affects infiltration success rates
  IntelligenceCrimeBaseExpGain: 0.05,
  IntelligenceProgramBaseExpGain: 0.1, // Program required hack level divided by this to determine int exp gain
  IntelligenceGraftBaseExpGain: 0.05,
  IntelligenceTerminalHackBaseExpGain: 200, // Hacking exp divided by this to determine int exp gain
  IntelligenceSingFnBaseExpGain: 1.5,
  IntelligenceClassBaseExpGain: 0.01,

  // Time-related constants
  MillisecondsPer20Hours: 72000000,
  GameCyclesPer20Hours: 72000000 / 200,

  MillisecondsPer10Hours: 36000000,
  GameCyclesPer10Hours: 36000000 / 200,

  MillisecondsPer8Hours: 28800000,
  GameCyclesPer8Hours: 28800000 / 200,

  MillisecondsPer4Hours: 14400000,
  GameCyclesPer4Hours: 14400000 / 200,

  MillisecondsPer2Hours: 7200000,
  GameCyclesPer2Hours: 7200000 / 200,

  MillisecondsPerHour: 3600000,
  GameCyclesPerHour: 3600000 / 200,

  MillisecondsPerHalfHour: 1800000,
  GameCyclesPerHalfHour: 1800000 / 200,

  MillisecondsPerQuarterHour: 900000,
  GameCyclesPerQuarterHour: 900000 / 200,

  MillisecondsPerFiveMinutes: 300000,
  GameCyclesPerFiveMinutes: 300000 / 200,

  // Player Work & Action
  BaseFocusBonus: 0.8,

  ClassDataStructuresBaseCost: 40,
  ClassNetworksBaseCost: 80,
  ClassAlgorithmsBaseCost: 320,
  ClassManagementBaseCost: 160,
  ClassLeadershipBaseCost: 320,
  ClassGymBaseCost: 120,

  ClassStudyComputerScienceBaseExp: 0.5,
  ClassDataStructuresBaseExp: 1,
  ClassNetworksBaseExp: 2,
  ClassAlgorithmsBaseExp: 4,
  ClassManagementBaseExp: 2,
  ClassLeadershipBaseExp: 4,

  // Coding Contract
  // TODO: Move this into Coding contract implementation?
  CodingContractBaseFactionRepGain: 2500,
  CodingContractBaseCompanyRepGain: 4000,
  CodingContractBaseMoneyGain: 75e6,

  // Augmentation grafting multipliers
  AugmentationGraftingCostMult: 3,
  AugmentationGraftingTimeBase: 3600000,

  // SoA mults
  SoACostMult: 7,
  SoARepMult: 1.3,

  // Value raised to the number of entropy stacks, then multiplied to player multipliers
  EntropyEffect: 0.98,

  // BitNode/Source-File related stuff
  TotalNumBitNodes: 24,

  InfiniteLoopLimit: 2000,

  Donations: 79,

  // Also update doc/source/changelog.rst
  LatestUpdate: `
v2.3.1 dev
----------

GENERAL / MISC:

* Tail window overhaul, ability to set tail title with ns.setTitle, other tail bugfixes and improvements. (@d0sboots)
* Nerf noodle bar
`,
};

function isValidNumber(n) {
  return typeof n === "number" && !isNaN(n);
}

function assertString(argName, v) {
  if (typeof v !== "string") {
    throw makeRuntimeErrorMsg(`${argName} expected to be a string. ${debugType(v)}`, "TYPE");
  }
}

/**
 * @param {string} msg
 * @param {string} type
 * @return {Error}
 * Creates an error message string with a stack trace.
 */
function makeRuntimeErrorMsg(msg, type = "RUNTIME") {
  return new Error(`Formulas ${type} error\n\n${msg}`);
}

function debugType(v) {
  if (v === null) return "Is null.";
  if (v === undefined) return "Is undefined.";
  if (typeof v === "function") return "Is a function.";
  return `Is of type '${typeof v}', value: ${userFriendlyString(v)}`;
}

function missingKey(expect, actual) {
  if (typeof actual !== "object" || actual === null) {
    return `Expected to be an object, was ${actual === null ? "null" : typeof actual}.`;
  }
  for (const key in expect) {
    if (!(key in actual)) {
      return `Property ${key} was expected but not present.`;
    }
  }
  return false;
}

function userFriendlyString(v) {
  const clip = (s) => {
    if (s.length > 15) return s.slice(0, 12) + "...";
    return s;
  };
  if (typeof v === "number") return String(v);
  if (typeof v === "string") {
    if (v === "") return "empty string";
    return `'${clip(v)}'`;
  }
  const json = JSON.stringify(v);
  if (!json) return "???";
  return `'${clip(json)}'`;
}

/**
 * @param {number} intelligence
 * @param {number} weight
 * @return {number}
 */
function calculateIntelligenceBonus(intelligence, weight = 1) {
  return 1 + (weight * Math.pow(intelligence, 0.8)) / 600;
}

/**
 * @param {Server} server
 * @param {Person} person
 * @return {number}
 */
function calculateHackingTime(server, person) {
  const hackDifficulty = server.hackDifficulty;
  const requiredHackingSkill = server.requiredHackingSkill;
  if (!hackDifficulty || !requiredHackingSkill) return Infinity;
  const difficultyMult = requiredHackingSkill * hackDifficulty;

  const baseDiff = 500;
  const baseSkill = 50;
  const diffFactor = 2.5;
  let skillFactor = diffFactor * difficultyMult + baseDiff;
  skillFactor /= person.skills.hacking + baseSkill;

  const hackTimeMultiplier = 5;
  const hackingTime =
    (hackTimeMultiplier * skillFactor) /
    (person.mults.hacking_speed * calculateIntelligenceBonus(person.skills.intelligence, 1));

  return hackingTime;
}

function clampNumber(value, min = -Number.MAX_VALUE, max = Number.MAX_VALUE) {
  if (isNaN(value)) {
    if (CONSTANTS.isDevBranch) throw new Error("NaN passed into clampNumber()");
    return min;
  }
  return Math.max(Math.min(value, max), min);
}

function clampInteger(value, min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  if (isNaN(value)) {
    if (CONSTANTS.isDevBranch) throw new Error("NaN passed into clampInteger()");
    return min;
  }
  return Math.round(Math.max(Math.min(value, max), min));
}
