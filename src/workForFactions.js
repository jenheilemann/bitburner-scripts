import {
  getNsDataThroughFile,
  runCommand,
  disableLogs,
  announce,
  formatDuration,
  formatMoney,
  formatNumber,
} from 'utils/helpers.js'

async function fetch(ns, cmd, filename) {
  return await getNsDataThroughFile(ns, cmd, filename)
}

const companySpecificConfigs = [
  { name: "NWO", statModifier: 25 },
  { name: "MegaCorp", statModifier: 25 },
  { name: "Blade Industries", statModifier: 25 },
  // Special snowflake
  { name: "Fulcrum Secret Technologies",
    companyName: "Fulcrum Technologies",
    repRequiredForFaction: 250000 },
  { name: "Silhouette",
    companyName: "TBD",
    repRequiredForFaction: 999e9 /* Hack to force work until max promotion. */ }
]

const factions = [
  "Illuminati", "Daedalus", "The Covenant", "ECorp", "MegaCorp",
  "Bachman & Associates", "Blade Industries", "NWO", "Clarke Incorporated",
  "OmniTek Incorporated", "Four Sigma", "KuaiGong International",
  "Fulcrum Secret Technologies", "BitRunners", "The Black Hand", "NiteSec",
  "Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12", "Volhaven",
  "Speakers for the Dead", "The Dark Army", "The Syndicate", "Silhouette",
  "Tetrads", "Slum Snakes", "Netburners", "Tian Di Hui", "CyberSec",
  "Bladeburners"
]

// These factions should ideally be completed in this order
// (TODO: Check for augmentation dependencies)
const preferredEarlyFactionOrder = [
  // Quick, and NightSec aug depends on an aug from here
  "CyberSec",
  // These give all the company_rep and faction_rep bonuses early game
  "Sector-12", "Tian Di Hui", "Aevum",
  // Required to set up hash income
  "Netburners",
  // Cha augs to speed up earning company promotions
  "NiteSec", "Tetrads",
  // Fastest sources of hacking augs after the above companies
  "The Black Hand", "BitRunners",
  // Once we have all faction_rep boosting augs, there's no reason not to
  // go for Daedalus as soon as it's available so we can buy Red Pill
  "Daedalus",
  // Boost company/faction rep for future augs
  "Bachman & Associates",
  // Will be removed if hack level is too low to backdoor their server
  "Fulcrum Secret Technologies",
  // More cmp_rep augs, and some strong hack ones as well
  "ECorp",
  // Unique cmp_rep aug
  // TODO: Can it sensibly be gotten before corps? Requires 300 all combat stats
  "The Dark Army",
  // More hack augs from companies
  "Clarke Incorporated", "OmniTek Incorporated", "NWO",
  // Unique Source of big 1.4x hack exp boost
  // Can only join if not in e.g. Aevum as well
  "Chongqing",
]

// This is an approximate order of most useful augmentations left to offer,
// assuming all early-game factions have been cleaned out
const preferredCompanyFactionOrder = [
  // Augs boost company_rep by 1.65, faction_rep by 1.50. Lower rep-requirements
  // than ECorp augs, so should be a priority to speed up future resets
  "Bachman & Associates",
  // Offers 2.26 multi worth of company_rep and major hacking stat boosts
  // (1.51 hack / 1.54 exp / 1.43 success / 3.0 grow / 2.8 money / 1.25 speed),
  // but high rep reqs
  "ECorp",
  // Biggest boost to hacking after above factions (1.38)
  "Clarke Incorporated",
  // Next big boost to hacking after above factions (1.20)
  // (NWO is bigger, but this has lower Cha reqs.)
  "OmniTek Incorporated",
  // Biggest boost to hacking after above factions (1.26)
  "NWO",
  // Mostly redundant after Ecorp - provides remaining hack-related augs
  // (1.10 money, 1.03 speed)
  "Blade Industries",
  // Offers 1 unique aug boosting all physical traits by 1.35
  "MegaCorp",
  // 1.40 to agility, defense, strength
  "KuaiGong International",
  // Big boosts to company_rep and hacking, but requires high hack level to
  // backdoor their server, so might have to be left until later
  "Fulcrum Secret Technologies",
  // No unique augs, but note that if accessible early on, Fulcrum + Four Sigma
  // is a one-two punch to get all company rep boosting augs in just 2 factions
  "Four Sigma",
]

const sec = 1000
const min = 60 * sec
const loopSleepInterval = 5 * sec
// outside of this, minor updates in e.g. stats aren't logged
const statusUpdateInterval = 2 * min
// Collect e.g. rep earned by stopping and starting work
const restartWorkInteval = 30 * sec
// Can be set via command line argument
let fastCrimesOnly = false;
let lastActionRestart = 0;
let mostExpensiveAugByFaction = [];
let mostExpensiveDesiredAugByFaction = [];
let favorToDonate;

const argsSchema = [
  // Grind rep with these factions first
  ['first', []],
  // Don't work for these factions
  ['skip', []],
  // Immediately grind company factions for rep after getting their invite
  // rather than first getting all company invites we can
  ['o', false],
  // Factions will be removed from our 'early-faction-order' once all augs with
  // these stats have been bought out
  ['desired-stats', ['hacking',
                     'faction_rep',
                     'company_rep',
                     'charisma',
                     'hacknet']],
  // Assasination and Heist are so slow, I can see people wanting to disable
  // them just so they can interrupt at will.
  ['fast-crimes-only', false],
]

export function autocomplete(data, args) {
  data.flags(argsSchema);
  const lastFlag = args.length > 1 ? args[args.length - 2] : null
  if (lastFlag == "--first" || lastFlag == "--skip")
    return factions.concat(factions.map(f => `'${f}'`)).sort()
  return []
}

/** @param {NS} ns */
export async function main(ns) {
  disableLogs(ns, ['sleep', 'getServerRequiredHackingLevel'])
  ns.tail()
  const options = ns.flags(argsSchema);
  const desiredAugStats = (options['desired-stats'] || []);
  const firstFactions = (options.first || []);
  let skipFactions = (options.skip || []);
  fastCrimesOnly = options['fast-crimes-only'];
  favorToDonate = await fetch(ns, `ns.getFavorToDonate()`, '/Temp/getFavorToDonate.txt')

  // Log command line args used
  if (firstFactions.length > 0) {
    ns.print(`--first factions: ${firstFactions.join(", ")}`);
  }

  if (skipFactions.length > 0) {
    ns.print(`--skip factions: ${skipFactions.join(", ")}`);
  }

  if (desiredAugStats.length > 0) {
    ns.print(`--desired-stats matching: ${desiredAugStats.join(", ")}`);
  }

  if (fastCrimesOnly) {
    ns.print(`--fast-crimes-only`);
  }

  function dictCommand(list, cmd) {
    return `Object.fromEntries(${JSON.stringify(list)}.map(o => [o, ${cmd}]))`
  }

  // Get some factions augmentations to decide what remains to be purchased
  const ownedAugs = await fetch(ns, `ns.getOwnedAugmentations(true)`,
    '/Temp/getOwnedAugmentations.txt')

  let cmd = dictCommand(factions, 'ns.getAugmentationsFromFaction(o)')
  const factionAugs = await fetch(ns, cmd, '/Temp/factionAugs.txt')
  const augmentationNames = [...new Set(Object.values(factionAugs).flat())]

  cmd = dictCommand(augmentationNames, 'ns.getAugmentationRepReq(o)')
  const augRepReqs = await fetch(ns, cmd, '/Temp/augRepreqs.txt')

  cmd = dictCommand(augmentationNames, 'ns.getAugmentationStats(o)')
  const dictAugStats = await fetch(ns, cmd, '/Temp/augStats.txt')

  mostExpensiveAugByFaction = Object.fromEntries(factions.map(f => [f, factionAugs[f]
    .filter(aug => !ownedAugs.includes(aug))
    .reduce((max, aug) => Math.max(max, augRepReqs[aug]), -1)]))
  ns.print("Most expensive unowned aug by faction: " +
    JSON.stringify(mostExpensiveAugByFaction))

  // TODO: Detect when the most expensive aug from two factions is the same -
  // only need it from the first one. (Update lists and remove 'afforded' augs?)
  mostExpensiveDesiredAugByFaction = Object.fromEntries(factions.map(f => [f, factionAugs[f]
    .filter(aug => !ownedAugs.includes(aug) &&
                    (Object.keys(dictAugStats[aug]).length == 0 ||
                      !desiredAugStats ||
                      Object.keys(dictAugStats[aug]).some(
                        key => desiredAugStats.some(
                          stat => key.includes(stat)))))
    .reduce((max, aug) => Math.max(max, augRepReqs[aug]), -1)]));
  ns.print("Most expensive desired aug by faction: " +
    JSON.stringify(mostExpensiveDesiredAugByFaction));

  let completedFactions = Object.keys(mostExpensiveAugByFaction).filter(
    f => mostExpensiveAugByFaction[f] == -1);
  skipFactions = skipFactions.concat(completedFactions);

  let softCompletedFactions = Object.keys(mostExpensiveDesiredAugByFaction)
    .filter(k => mostExpensiveDesiredAugByFaction[k] == -1 &&
      !completedFactions.includes(k));
  ns.print(`${completedFactions.length
    } factions are completed (all augs purchased): ${
      completedFactions.join(", ")}`);
  ns.print(`${softCompletedFactions.length
    } factions will initially be skipped (all desired augs purchased): ${
      softCompletedFactions.join(", ")}`);

  // Scope increases each time we complete a type of work and haven't progressed
  // enough to unlock more factions
  let scope = -1;
  let numJoinedFactions = ns.getPlayer().factions.length;

  // After each loop, we will repeat all prevous work "strategies" to see if
  // anything new has been unlocked, and add one more "strategy" to the queue
  while (true) {
    scope++;
    ns.print(`Starting main work loop with scope: ${scope}...`);
    if (ns.getPlayer().factions.length > numJoinedFactions) {
      // Back to basics until we've satisfied all highest-priority work
      scope = 0;
      numJoinedFactions = ns.getPlayer().factions.length;
    }

    // Remove Fulcrum from our "EarlyFactionOrder" if hack level is insufficient
    // to backdoor their server
    let priorityFactions = preferredEarlyFactionOrder.slice();
    let fulcrummHackReq = ns.getServerRequiredHackingLevel("fulcrumassets")
    // Assume that if we're within 10, we'll get there by the time we've earned
    // the invite
    // TODO: Otherwise, if we get Fulcrum, we have no need for a couple other
    // company factions
    if (ns.getPlayer().hacking < fulcrummHackReq - 10) {
      let index = priorityFactions.findIndex(c => c == "Fulcrum Secret Technologies")
      priorityFactions.splice(index, 1)
      ns.print(`Fulcrum faction server requires ${fulcrummHackReq
        } hack, so removing from our initial priority list for now.`);
    }

    // Strategy 1: Tackle a consolidated list of desired faction order,
    // interleaving simple factions and megacorporations
    let workFor = priorityFactions.filter(f => !firstFactions.includes(f) &&
                                               !skipFactions.includes(f))
    // Remove factions from our initial "work order" if we've bought all
    // desired augmentations.
    const factionWorkOrder = firstFactions.concat(workFor)
      .filter(f => !softCompletedFactions.includes(f))

    for (const faction of factionWorkOrder) {
      let earnedNewFactionInvite = false;
      // If this is a company faction, we need to work for the company first
      if (preferredCompanyFactionOrder.includes(faction)) {
        earnedNewFactionInvite = await workForMegacorpFactionInvite(ns, faction, true);
      }
      // If work was done for a company or their faction, restart the main work
      // loop to see if we've unlocked a higher-priority faction in the list
      if (earnedNewFactionInvite || await workForSingleFaction(ns, faction)) {
        // De-increment scope so that effecitve scope doesn't increase on the
        // next loop (i.e. it will be incrementedback to what it is now)
        scope--;
        break;
      }
    }
    if (scope < 1) continue;

    // Strategy 2: Grind XP with all priority factions that are joined or can be
    // joined, until every single one has desired REP
    for (const faction of factionWorkOrder)
      await workForSingleFaction(ns, faction);
    if (scope < 2) continue;

    // Strategy 3: Work for any megacorporations not yet completed to earn their
    // faction invites. Once joined, we don't lose these factions on reset.
    let megacorpFactions = preferredCompanyFactionOrder.filter(f => !skipFactions.includes(f));
    await workForAllMegacorps(ns, megacorpFactions, false);
    if (scope < 3) continue;

    // Strategy 4: Work for megacorps again, but this time also work for the company factions once the invite is earned
    await workForAllMegacorps(ns, megacorpFactions, true);
    if (scope < 4) continue;

    // Strategies 5+ now work towards getting an invite to *all factions in the
    // game* (sorted by least-expensive final aug (correlated to easiest
    // faction-invite requirement))

    // In case our hard-coded list of factions is missing anything, merge it
    // with the list of all factions
    let joinedFactions = ns.getPlayer().factions;
    let allIncompleteFactions = factions.concat(joinedFactions.filter(f => !factions.includes(f))).filter(f => !skipFactions.includes(f) && !completedFactions.includes(f))
      .sort((a, b) => mostExpensiveAugByFaction[a] - mostExpensiveAugByFaction[b]);
    // Strategy 5: For *all factions in the game*, try to earn an invite and work for rep until we can afford the most-expensive *desired* aug (or unlock donations, whichever comes first)
    for (const faction of allIncompleteFactions.filter(f => !softCompletedFactions.includes(f)))
      await workForSingleFaction(ns, faction);
    if (scope < 5) continue;

    // Strategy 6: Revisit all factions until each has enough rep to unlock donations - so if we can't afford all augs this reset, at least we don't need to grind for rep on the next reset
    // For this, we reverse the order (ones with augs costing the most-rep to least) since these will take the most time to re-grind rep for if we can't buy them this reset.
    for (const faction of allIncompleteFactions.reverse())
      await workForSingleFaction(ns, faction, true);
    if (scope < 6) continue;

    // Strategy 7:  Next, revisit all factions and grind XP until we can afford the most expensive aug, even if we could just buy the required rep next reset
    for (const faction of allIncompleteFactions.reverse()) // Re-reverse the sort order so we start with the easiest (cheapest) faction augs to complete
      await workForSingleFaction(ns, faction, true, true);
    if (scope < 7) continue;

    // Strategy 8: Commit crimes until until the highest known faction requirement would be met. We may have been missing other requirements for those factions, but at least we can get this out of the way.
    await crimeForKillsKarmaStats(ns, 30, 90, 1500);
    if (scope < 8) continue;

    // Strategy 9: Commit more crimes until our human comes and gives us something better to do (for money / stats)
    await crimeForKillsKarmaStats(ns, 0, 0, Number.MAX_VALUE);
  }
}

const requiredMoneyByFaction = {
  "Tian Di Hui": 1E6, "Sector-12": 15E6, "Chongqing": 20E6, "New Tokyo": 20E6,
  "Ishima": 30E6, "Aevum": 40E6, "Volhaven": 50E6, "Slum Snakes": 1E6,
  "Silhouette": 15E6, "The Syndicate": 10E6, "The Covenant": 75E9,
  "Daedalus": 100E9, "Illuminati": 150E9
}
const requiredBackdoorByFaction = {
  "CyberSec": "CSEC", "NiteSec": "avmnite-02h", "The Black Hand": "I.I.I.I",
  "BitRunners": "run4theh111z", "Fulcrum Secret Technologies": "fulcrumassets"
}
const requiredHackByFaction = {
  "Tian Di Hui": 50, "Netburners": 80, "Speakers for the Dead": 100,
  "The Dark Army": 300, "The Syndicate": 200, "The Covenant": 850,
  "Daedalus": 2500, "Illuminati": 1500
}
const requiredCombatByFaction = {
  "Slum Snakes": 30, "Tetrads": 75, "Speakers for the Dead": 300,
  "The Dark Army": 300, "The Syndicate": 200, "The Covenant": 850,
  "Daedalus": 1500, "Illuminati": 1200
}
const requiredKarmaByFaction = {
  "Slum Snakes": 9, "Tetrads": 18, "Silhouette": 22,
  "Speakers for the Dead": 45, "The Dark Army": 45, "The Syndicate": 90
}
const requiredKillsByFaction = {"Speakers for the Dead": 30, "The Dark Army": 5}

/** @param {NS} ns */
export async function earnFactionInvite(ns, factionName) {
  const player = ns.getPlayer();
  const joinedFactions = player.factions;
  if (joinedFactions.includes(factionName)) return true;
  var invitations = await fetch(ns, 'ns.checkFactionInvitations()',
    '/Temp/checkFactionInvitations.txt')
  if (invitations.includes(factionName))
    return await tryJoinFaction(ns, factionName);

  // Can't join certain factions for various reasons
  let reasonPrefix = `Cannot join faction "${factionName}" because`;
  let precludingFaction;
  if (["Aevum", "Sector-12"].includes(factionName) && (precludingFaction = ["Chongqing", "New Tokyo", "Ishima", "Volhaven"].find(f => joinedFactions.includes(f))) ||
    ["Chongqing", "New Tokyo", "Ishima"].includes(factionName) && (precludingFaction = ["Aevum", "Sector-12", "Volhaven"].find(f => joinedFactions.includes(f))) ||
    ["Volhaven"].includes(factionName) && (precludingFaction = ["Aevum", "Sector-12", "Chongqing", "New Tokyo", "Ishima"].find(f => joinedFactions.includes(f))))
    return ns.print(`${reasonPrefix} precluding faction "${precludingFaction}" has been joined.`)

  // Skip factions for which money/hack level requirements aren't met. We do not attempt to "train up" for these things (happens automatically outside this script)
  let requirement;
  if ((requirement = requiredMoneyByFaction[factionName]) && player.money < requirement)
    return ns.print(`${reasonPrefix} you have insufficient money. Need: ${formatMoney(requirement)}, Have: ${formatMoney(player.money)}`);
  if ((requirement = requiredHackByFaction[factionName]) && player.skills.hacking < requirement)
    return ns.print(`${reasonPrefix} you have insufficient hack level. Need: ${requirement}, Have: ${player.skills.hacking}`);
  if ((requirement = requiredBackdoorByFaction[factionName]) && player.skills.hacking < ns.getServerRequiredHackingLevel(requirement))
    return ns.print(`${reasonPrefix} you must fist backdoor ${requirement}, which needs hack: ${ns.getServerRequiredHackingLevel(requirement)}, Have: ${player.skills.hacking}`);
  // TODO: Do backdoor if we can but haven't yet?

  // See if we can take action to earn an invite for the next faction under consideration
  let workedForInvite = false;
  // If committing crimes can help us join a faction - we know how to do that
  let doCrime = false;
  if ((requirement = requiredKarmaByFaction[factionName]) && -ns.heart.break() < requirement) {
    ns.print(`${reasonPrefix} you have insufficient Karma. Need: ${-requirement}, Have: ${ns.heart.break()}`);
    doCrime = true;
  }
  if ((requirement = requiredKillsByFaction[factionName]) && player.numPeopleKilled < requirement) {
    ns.print(`${reasonPrefix} you have insufficient kills. Need: ${requirement}, Have: ${player.numPeopleKilled}`);
    doCrime = true;
  }
  if ((requirement = requiredCombatByFaction[factionName]) && ([player.strength, player.defense, player.dexterity, player.agility].find(stat => stat < requirement))) {
    ns.print(`${reasonPrefix} you have insufficient combat stats. Need: ${requirement} of each, ` +
      `Have Str: ${player.strength}, Def: ${player.defense}, Dex: ${player.dexterity}, Agi: ${player.agility}`);
    doCrime = true; // TODO: There could be more efficient ways to gain combat stats than homicide, although at least this serves future crime factions
  }
  if (doCrime)
    workedForInvite = await crimeForKillsKarmaStats(ns, requiredKillsByFaction[factionName] || 0, requiredKarmaByFaction[factionName] || 0, requiredCombatByFaction[factionName] || 0);
  // If travelling can help us join a faction - we can do that too
  if (['Tian Di Hui', 'Tetrads', 'The Dark Army'].includes(factionName))
    workedForInvite = await goToCity(ns, 'Chongqing');
  else if (['The Syndicate'].includes(factionName))
    workedForInvite = await goToCity(ns, 'Sector-12');
  else if (["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"].includes(factionName))
    workedForInvite = await goToCity(ns, factionName);
  if ("Silhouette" == factionName) {
    ns.print(`You must be a CO (e.g. CEO/CTO) of a company to earn an invite to ${factionName}. This may take a while!`);
    let factionConfig = companySpecificConfigs.find(f => f.name == factionName); // We set up Silhouette with a "company-specific-config" so that we can work for an invite like any megacorporation faction.
    factionConfig.companyName = preferredCompanyFactionOrder.map(f => companySpecificConfigs.find(cf => cf.name == f)?.companyName || f)
      // Change the "Silhouette" company config to be whichever company we have the most favor with (rep will increase fastest). Break ties with Rep.
      .sort((a, b) => (Math.round(ns.getCompanyFavor(b)) - Math.round(ns.getCompanyFavor(a))) || (ns.getCompanyRep(b) - ns.getCompanyRep(a)))[0];
    // Super-hack. Kick off an external script that just loops until it joins the faction, since we can't have concurrent ns calls in here.
    await runCommand(ns, `while(true) { if(ns.joinFaction('${factionName}')) return; else await ns.sleep(1000); }`, '/Temp/join-faction-loop.js');
    workedForInvite = await workForMegacorpFactionInvite(ns, factionName, false); // Work until CTO and the external script joins this faction, triggering an exit condition.
  }

  if (workedForInvite) // If we took some action to earn the faction invite, wait for it to come in
    return await waitForFactionInvite(ns, factionName);
  else
    return await tryJoinFaction(ns, factionName);

}

/** @param {NS} ns */
async function goToCity(ns, cityName) {
  if (ns.getPlayer().city == cityName) {
    ns.print(`Already in city ${cityName}`);
    return true;
  }
  if (await fetch(ns, `ns.travelToCity('${cityName}')`, `/Temp/travel.${cityName[0]}.txt`)) {
    lastActionRestart = Date.now();
    announce(ns, `Travelled to ${cityName}`, 'info');
    return true;
  }
  announce(ns, `Failed to travelled to ${cityName} for some reason...`, 'error');
  return false;
}

/** @param {NS} ns
 *  @param {function} crimeCommand if you want to commit the RAM footprint, you
 *                    can pass in ns.commitCrime, otherise it will run via
 *                    ram-dodging getNsDataThroughFile
 */
export async function crimeForKillsKarmaStats(ns, reqKills, reqKarma, reqStats, crimeCommand = null) {
  const bestCrimesByDifficulty = ["heist", "assassinate", "homicide", "mug"]; // Will change crimes as our success rate improves
  const chanceThresholds = [0.2, 0.75, 0.5, 0]; // Will change crimes once we reach this probability of success for better all-round gains
  if (!crimeCommand) crimeCommand = async crime => await fetch(ns, `ns.commitCrime('${crime}')`, '/Temp/crime-time.txt');
  let player = ns.getPlayer();
  let strRequirements = [];
  let forever = reqKills >= Number.MAX_SAFE_INTEGER || reqKarma >= Number.MAX_SAFE_INTEGER || reqStats >= Number.MAX_SAFE_INTEGER;
  if (reqKills) strRequirements.push(() => `${reqKills} kills (Have ${player.numPeopleKilled})`);
  if (reqKarma) strRequirements.push(() => `-${reqKarma} Karma (Have ${ns.heart.break()})`);
  if (reqStats) strRequirements.push(() => `${reqStats} of each combat stat (Have Str: ${player.strength}, Def: ${player.defense}, Dex: ${player.dexterity}, Agi: ${player.agility})`);
  let crime, lastCrime, lastStatusUpdateTime, crimeCount = 0;
  while (forever || player.strength < reqStats || player.defense < reqStats || player.dexterity < reqStats || player.agility < reqStats || player.numPeopleKilled < reqKills || -ns.heart.break() < reqKarma) {
    let crimeChances = await fetch(ns, `Object.fromEntries(${JSON.stringify(bestCrimesByDifficulty)}.map(c => [c, ns.getCrimeChance(c)]))`, '/Temp/crime-chances.txt');
    let needStats = player.strength < reqStats || player.defense < reqStats || player.dexterity < reqStats || player.agility < reqStats;
    let karma = -ns.heart.break();
    crime = karma < 1 && crimeCount < 10 ? "mug" : karma < 5 && crimeCount < 20 ? "homicide" : // Start with a few fast crimes to boost stats / crime chances if we haven't done much crime before
      (!needStats && (player.numPeopleKilled < reqKills || karma < reqKarma)) ? "homicide" : // If *all* we need now is kills or Karma, homicide is the fastest way to do that
        bestCrimesByDifficulty.find((c, index) => fastCrimesOnly ? index > 1 : crimeChances[c] >= chanceThresholds[index]); // Otherwise, crime based on success chance vs relative reward (precomputed)
    if (lastCrime != crime || (Date.now() - lastStatusUpdateTime) > statusUpdateInterval) {
      ns.print(`Committing "${crime}" (${(100 * crimeChances[crime]).toPrecision(3)}% success) ` + (forever ? 'forever...' : `until we reach ${strRequirements.map(r => r()).join(', ')}`));
      lastCrime = crime;
      lastStatusUpdateTime = Date.now();
    }
    await ns.sleep(await crimeCommand(crime));
    while ((player = ns.getPlayer()).crimeType == `commit ${crime}` || player.crimeType == crime) // If we woke up too early, wait a little longer for the crime to finish
      await ns.sleep(10);
    crimeCount++;
  }
  ns.print(`Done committing crimes. Reached ${strRequirements.map(r => r()).join(', ')}`);
  return true;
}

/** @param {NS} ns */
async function studyForCharisma(ns) {
  await goToCity(ns, 'Volhaven');
  if (await fetch(ns, `ns.universityCourse('ZB Institute Of Technology', 'Leadership')`, '/Temp/study.txt')) {
    lastActionRestart = Date.now();
    announce(ns, `Started studying 'Leadership' at 'ZB Institute Of Technology`, 'success');
    return true;
  }
  announce(ns, `For some reason, failed to study at university (not in correct city?)`, 'error');
  return false;
}

/** @param {NS} ns */
export async function waitForFactionInvite(ns, factionName, maxWaitTime = 20000) {
  ns.print(`Waiting for invite from faction "${factionName}"...`)
  let waitTime = maxWaitTime
  do {
    var invitations = await fetch(ns, 'ns.checkFactionInvitations()',
      '/Temp/checkFactionInvitations.txt')
    var joinedFactions = ns.getPlayer().factions;
    if (!invitations.includes(factionName) && !joinedFactions.includes(factionName))
      await ns.sleep(loopSleepInterval);
  } while (!invitations.includes(factionName) && !joinedFactions.includes(factionName) && (waitTime -= 1000) > 0);
  if (joinedFactions.includes(factionName)) // Another script may have auto-joined this faction before we could
    ns.print(`An external script has joined faction "${factionName}" for us.`);
  else if (!invitations.includes(factionName))
    return announce(ns, `Waited ${formatDuration(maxWaitTime)}, but still have not recieved an invite for faction: "${factionName}" (Requirements not met?)`, 'error');
  else if (!(await tryJoinFaction(ns, factionName)))
    return announce(ns, `Something went wrong. Earned "${factionName}" faction invite, but failed to join it.`, 'error');
  return true;
}

/** @param {NS} ns */
export async function tryJoinFaction(ns, factionName) {
  var joinedFactions = ns.getPlayer().factions;
  if (joinedFactions.includes(factionName))
    return true;
  if (!(await fetch(ns, `ns.joinFaction('${factionName}')`, '/Temp/join-faction.txt')))
    return false;
  announce(ns, `Joined faction "${factionName}"`, 'success');
  return true;
}

/** @param {NS} ns */
async function getCurrentFactionFavour(ns, factionName) {
  let cmd = `ns.getFactionFavor('${factionName}')`
  return await fetch(ns, cmd, '/Temp/faction-favor.txt');
}

let lastFactionWorkStatus = "";
/**
 * @param {NS} ns
 * @param {string} factionName
 * @param {boolean} forceUnlockDonations
 * @param {boolean} forceBestAug
 * Checks how much reputation we need with this faction to either buy all
 * augmentations or get 150 favour, then works to that amount.
 * */
export async function workForSingleFaction(ns, factionName, forceUnlockDonations = false, forceBestAug = false) {
  const highestRepAug = forceBestAug ? mostExpensiveAugByFaction[factionName] : mostExpensiveDesiredAugByFaction[factionName];
  const repToFavour = (rep) => Math.ceil(25500 * 1.02 ** (rep - 1) - 25000);
  let startingFavor = await getCurrentFactionFavour(ns, factionName);
  let favorRepRequired = Math.max(0, repToFavour(favorToDonate) - repToFavour(startingFavor));
  // When to stop grinding faction rep (usually ~467,000 to get 150 favour) Set this lower if there are no augs requiring that much REP
  let factionRepRequired = forceUnlockDonations ? favorRepRequired : Math.min(highestRepAug, favorRepRequired);
  if (highestRepAug == 0)
    return ns.print(`All "${factionName}" augmentations are owned. Skipping working for faction...`);
  if (startingFavor >= favorToDonate) // If we have already got 150+ favor, we've unlocked donations - no need to grind for rep
    return ns.print(`Donations already unlocked for "${factionName}". You should buy access to augs. Skipping working for faction...`);
  if (forceUnlockDonations && mostExpensiveAugByFaction[factionName] < 0.2 * factionRepRequired) // Special check to avoid pointless donation unlocking
    return ns.print(`The last "${factionName}" aug is only ${mostExpensiveAugByFaction[factionName].toLocaleString()} rep, ` +
      `not worth grinding ${favorRepRequired.toLocaleString()} rep to unlock donations.`);

  // Ensure we get an invite to location-based factions we might want / need
  if (!await earnFactionInvite(ns, factionName))
    return ns.print(`We are not yet part of faction "${factionName}". Skipping working for faction...`);

  if (ns.getPlayer().workRepGained > 0) // If we're currently woing faction work, stop to collect reputation and find out how much is remaining
    await fetch(ns, `ns.stopAction()`, '/Temp/stopAction.txt');
  let currentReputation = ns.getFactionRep(factionName);
  // If the best faction aug is within 10% of our current rep, grind
  // all the way to it so we can get it immediately, regardless of our
  // current rep target
  if (forceBestAug || highestRepAug <= 1.1 * Math.max(currentReputation, factionRepRequired)) {
    forceBestAug = true;
    factionRepRequired = Math.max(highestRepAug, factionRepRequired);
  }

  if (currentReputation >= factionRepRequired)
    return ns.print(`Faction "${factionName}" required rep of ${factionRepRequired.toLocaleString()} has already been attained ` +
      `(Current rep: ${Math.round(currentReputation).toLocaleString()}). Skipping working for faction...`)

  ns.print(`Faction "${factionName}" Highest Aug Req: ` +
    `${highestRepAug.toLocaleString()}, Current Favor (${startingFavor}/${favorToDonate}) ` +
    `Req: ${favorRepRequired.toLocaleString()}`);
  let lastStatusUpdateTime;

  currentReputation = ns.getFactionRep(factionName)
  while (currentReputation < factionRepRequired) {
    const factionWork = await detectBestFactionWork(ns, factionName); // Before each loop - determine what work gives the most rep/second for our current stats
    if (await fetch(ns, `ns.workForFaction('${factionName}', '${factionWork}')`, '/Temp/work-for-faction.txt'))
      lastActionRestart = Date.now();
    else {
      announce(ns, `Something went wrong, failed to start working for faction "${factionName}" (Not joined?)`, 'error');
      break;
    }
    currentReputation = ns.getFactionRep(factionName)
    let status = `Doing '${factionWork}' work for "${factionName}" until ${factionRepRequired.toLocaleString()} rep.`;
    if (lastFactionWorkStatus != status || (Date.now() - lastStatusUpdateTime) > statusUpdateInterval) {
      ns.print((lastFactionWorkStatus = status) + ` Currently at ${Math.round(currentReputation).toLocaleString()}, earning ${(ns.getPlayer().workRepGainRate * 5).toFixed(2)} rep/sec.`);
      lastStatusUpdateTime = Date.now();
    }
    await tryBuyReputation(ns)

    let sleepFor = Math.max(restartWorkInteval, 1000*(factionRepRequired - currentReputation)/(ns.getPlayer().workRepGainRate * 5)/3)
    if ( sleepFor > restartWorkInteval ) {
      ns.print(`Working for ${formatDuration(sleepFor)}. See ya in a bit...`)
    }
    await ns.sleep(sleepFor)

    // Detect our rep requirement decreasing (e.g. if we exported for our daily +1 faction rep)
    let currentFavor = await getCurrentFactionFavour(ns, factionName);
    if (currentFavor > startingFavor && !forceBestAug) {
      favorRepRequired = Math.max(0, repToFavour(favorToDonate) - repToFavour(startingFavor));
      factionRepRequired = forceUnlockDonations ? favorRepRequired : Math.min(highestRepAug, favorRepRequired);
    }

    // If we explicitly stop working, we immediately get our updated faction rep,
    // otherwise it lags by 1 loop (until after next time we call workForFaction)
    // Note: Actual work rep gained will be subject to early cancellation policy

    currentReputation = ns.getFactionRep(factionName)
    if (currentReputation + ns.getPlayer().workRepGained >= factionRepRequired) {
      // We're close - stop working so our current rep is accurate when we check
      // the while loop condition
      await fetch(ns, `ns.stopAction()`, '/Temp/stopAction.txt')
    }
    currentReputation = ns.getFactionRep(factionName)
  }
  if (currentReputation >= factionRepRequired)
    ns.print(`Attained ${Math.round(currentReputation).toLocaleString()} rep with "${factionName}" (needed ${factionRepRequired.toLocaleString()}).`);
  return currentReputation >= factionRepRequired;
}

/** @param {NS} ns
 * Try all work types and see what gives the best rep gain with this faction! */
async function detectBestFactionWork(ns, factionName) {
  let bestWork, bestRepRate = 0;
  for (const work of ["security", "fieldwork", "hacking"]) {
    if (!await fetch(ns, `ns.workForFaction('${factionName}', '${work}')`, '/Temp/work-for-faction.txt'))
      continue; // This type of faction work must not be supported
    const currentRepGainRate = ns.getPlayer().workRepGainRate;
    if (currentRepGainRate > bestRepRate) {
      bestRepRate = currentRepGainRate;
      bestWork = work;
    }
  }
  return bestWork;
}

/**
 * @param {NS} ns
 * @param {Array<string>} megacorpFactions - The list of all corporate factions
 *          to work for, sorted in the order they should be worked for
 * @param {Boolean} workForFaction - Work for the company faction in this cycle
 * @param {Boolean} oneAtATime - Work for the faction immediately after earning
 *          the invite
 **/
async function workForAllMegacorps(ns, megacorpFactions, workForFaction, oneAtATime) {
  let player = ns.getPlayer()
  if (player.skills.hacking < 225) {
    ns.print(`Hacking Skill ${player.skills.hacking} is to low to work for any ` +
      `megacorps (min req. 225).`);
    return
  }

  // Company factions we've already joined
  let joinedFactions = player.factions.filter(f => megacorpFactions.includes(f))
  if (joinedFactions.length > 0) {
    ns.print(`${joinedFactions.length} companies' factions have already been ` +
      `joined: ${joinedFactions.join(", ")}`)
  }

  let doFactionWork = workForFaction && oneAtATime
  // Earn each obtainable megacorp faction invite
  for (const factionName of megacorpFactions) {
    if ((await workForMegacorpFactionInvite(ns, factionName, doFactionWork)) && doFactionWork) {
      // and optionally also grind faction rep
      await workForSingleFaction(ns, factionName);
    }
  }
  // If configured, start grinding rep with company factions we've joined
  if (workForFaction && !oneAtATime) {
    ns.print(`Done working for companies, now working for all incomplete company factions...`);
    for (const factionName of megacorpFactions)
      await workForSingleFaction(ns, factionName);
  }
}

/**
 * If we're wealthy, hashes have relatively little monetary value, spend
 * hacknet-node hashes on contracts to gain rep faster
 * @param {NS} ns
 **/
async function tryBuyReputation(ns) {
  // If we're wealthy, hashes have relatively little monetary value,
  // spend hacknet-node hashes on contracts to gain rep faster
  if (ns.getPlayer().money > 100E9) {
    let cmd = 'ns.hacknet.numHashes() + ns.hacknet.spendHashes("Generate ' +
              'Coding Contract") - ns.hacknet.numHashes()'
    let spentHashes = await fetch(ns, cmd, '/Temp/hacknet.spendHashes.txt');
    if (spentHashes > 0) {
      announce(ns, `Generated a new coding contract for ` +
        `${formatNumber(Math.round(spentHashes / 100) * 100)} hashes`,
        'success')
    }
  }
}


// Job stat requirements for a company with a base stat modifier of +224
// (modifier of all megacorps except the ones above which are 25 higher)
const jobs = [
  {
    name: "it",
    reqRep: [0, 7E3, 35E3, 175E3],
    reqHack: [225, 250, 275, 375],
    reqCha: [0, 0, 275, 300],
    repMult: [0.9, 1.1, 1.3, 1.4]
  },
  {
    name: "software",
    reqRep: [0, 8E3, 40E3, 200E3, 400E3, 800E3, 1.6e6, 3.2e6],
    reqHack: [225, 275, 475, 625, 725, 725, 825, 975],
    reqCha: [0, 0, 275, 375, 475, 475, 625, 725],
    repMult: [0.9, 1.1, 1.3, 1.5, 1.6, 1.6, 1.75, 2]
  },
]

/**
 * @param {NS} ns
 * @param {string} factionName - name of the company faction to try getting an invite
 * @param {boolean} waitForInvite -
 **/
async function workForMegacorpFactionInvite(ns, factionName, waitForInvite) {
  // For anything company-specific
  const companyConfig = companySpecificConfigs.find(c => c.name == factionName)
  // Name of the company that gives the faction (same for all but Fulcrum)
  const companyName = companyConfig?.companyName || factionName
  // How much Hack/Cha is needed for promotion above the requirement for the job
  const statModifier = companyConfig?.statModifier || 0
  // Required to unlock the faction
  const repRequired = companyConfig?.repRequiredForFaction || 200000

  let player = ns.getPlayer()
  if (player.factions.includes(factionName)) {
    // Only return true if we did work to earn a new faction invite
    return false
  }

  var invitations = await fetch(ns, 'ns.checkFactionInvitations()',
    '/Temp/checkFactionInvitations.txt')
  if (invitations.includes(factionName)) {
    return await tryJoinFaction(ns, factionName)
  }

  // TODO: In some scenarios, the best career path may require combat stats,
  // this hard-codes the optimal path for hack stats
  const itJob = jobs.find(j => j.name == "it")
  const softwareJob = jobs.find(j => j.name == "software")
  // We don't qualify to work for this company yet if we can't meet
  // IT qualifications (lowest there are)
  if (itJob.reqHack[0] + statModifier > player.skills.hacking) {
    ns.print(`Cannot yet work for "${companyName}": ` +
      `Need Hack ${itJob.reqHack[0] + statModifier} to get hired ` +
      `(current Hack: ${player.skills.hacking});`)
    return
  }

  ns.print(`Going to work for Company "${companyName}" next...`)
  // TODO: Derive our current position and promotion index based on player.jobs[companyName]
  let currentReputation, currentRole = "", currentJobTier = -1
  let lastStatusUpdateTime, lastStatus = ""
  let studying = false, working = false

  function getTier(job) {
    let rep = job.reqRep.filter(r => r <= currentReputation).length
    let hack = job.reqHack.filter(h => h <= player.skills.hacking).length
    let cha = job.reqCha.filter(c => c <= player.charisma).length
    return Math.min(rep, hack, cha) - 1
  }

  while (((currentReputation = ns.getCompanyRep(companyName)) < repRequired) &&
    !player.factions.includes(factionName)) {

    player = ns.getPlayer()

    // Determine the next promotion we're striving for (the sooner we get
    // promoted, the faster we can earn company rep)

    // It's generally best to hop back-and-forth between IT and software engi
    // career paths (rep gain is about the same, but better money from software)
    const qualifyingItTier = getTier(itJob)
    const qualifyingSoftwareTier = getTier(softwareJob)
    // Go with whatever job promotes us higher
    const bestJobTier = Math.max(qualifyingItTier, qualifyingSoftwareTier)
    // If tied for qualifying tier, go for software
    const bestRoleName = qualifyingItTier > qualifyingSoftwareTier ? "it" : "software"

    // We are ready for a promotion, ask for one!
    if (currentJobTier < bestJobTier || currentRole != bestRoleName) {
      let cmd = `ns.applyToCompany('${companyName}','${bestRoleName}')`
      if (await fetch(ns, cmd, '/Temp/apply-to-company.txt')) {
        announce(ns, `Successfully applied to "${companyName}" for a ` +
          `${bestRoleName}' Job or Promotion`, 'success')
      }
      // Unless we just restarted "work-for-factions" and lost track of our
      // current job, this is an error
      else if (currentJobTier !== -1) {
        announce(ns, `Application to "${companyName}" for a '${bestRoleName}'` +
          ` Job or Promotion failed.`, 'error');
      }
      // API to apply for a job gives us the highest tier we qualify for
      currentJobTier = bestJobTier;
      currentRole = bestRoleName;
      player = ns.getPlayer();
    }

    const currentJob = player.jobs[companyName]
    const nextJobTier = currentRole == "it" ? currentJobTier : currentJobTier + 1
    const swap = (currentRole == "it" || nextJobTier >= itJob.reqRep.length)
    const nextJobName = swap ? "software" : "it"
    const nextJob = nextJobName == "it" ? itJob : softwareJob
    // Stat modifier only applies to non-zero reqs
    const requiredHack = nextJob.reqHack[nextJobTier] === 0 ? 0 : nextJob.reqHack[nextJobTier] + statModifier
    // Stat modifier only applies to non-zero reqs
    const requiredCha = nextJob.reqCha[nextJobTier] === 0 ? 0 : nextJob.reqCha[nextJobTier] + statModifier
    // No modifier on rep requirements
    const requiredRep = nextJob.reqRep[nextJobTier]

    // Setup current status message
    let noPromo = (repRequired > nextJob.reqRep[nextJobTier] ? '' : `, but ` +
      `we won't need it, because we'll sooner hit ` +
      `${repRequired.toLocaleString()} reputation to unlock ` +
      `company faction "${factionName}"!`)
    let status = `Next promotion ('${nextJobName}' #${nextJobTier}) at ` +
      `Hack: ${requiredHack} ` +
      `Cha:${requiredCha} ` +
      `Rep:${requiredRep?.toLocaleString()}` +
      noPromo

    // We should only study at university if only Charisma is needed
    if (currentReputation >= requiredRep && player.hacking >= requiredHack &&
      player.charisma < requiredCha) {

      status = `Studying at ZB university until Cha reaches ` +
               `${requiredCha}...\n` + status
      if (studying && player.className !== 'taking a Leadership course' && player.className !== 'Leadership' /* In case className is made more intuitive in the future */) {
        announce(ns, `Leadership studies were interrupted. player.className="${player.className}" Restarting in 5 seconds...`, 'warning');
        studying = false; // If something external has interrupted our studies, take note
        await ns.sleep(5000); // Give the user some time to kill this script if they accidentally closed the tail window and don't want to keep studying
      }
      if (!studying) { // Study at ZB university if CHA is the limiter.
        if (await studyForCharisma(ns))
          working = !(studying = true);
      }
      // Try to spend hacknet-node hashes on university upgrades while we've got
      // a ways to study to make it go faster
      if (requiredCha - player.charisma > 10) {
        if (await fetch(ns, 'ns.hacknet.spendHashes("Improve Studying")',
          '/Temp/hacknet.spendHashes.txt')) {
          announce(ns, 'Bought a "Improve Studying" upgrade.', 'success');
          await studyForCharisma(ns); // We must restart studying for the upgrade to take effect.
        }
      }
    } else if (studying) { // If we no longer need to study and we currently are, turn off study mode and get back to work!
      studying = false;
      continue; // Restart the loop so we refresh our promotion index and apply for a promotion before working more
    }
    await tryBuyReputation(ns);

    // Regardless of the earlier promotion logic, always try for a promotion to make sure we don't miss a promotion due to buggy logic
    if (await fetch(ns, `ns.applyToCompany('${companyName}','${currentRole}')`, '/Temp/apply-to-company.txt'))
      announce(ns, `Unexpected '${currentRole}' promotion from ${currentJob} to "${ns.getPlayer().jobs[companyName]}. Promotion logic must be off..."`, 'warning');
    // TODO: If we ever get rid of the below periodic restart-work, we will need to monitor for interruptions with player.workType == e.g. "Work for Company"
    if (!studying && (!working || (Date.now() - lastActionRestart >= restartWorkInteval) /* We must periodically restart work to collect Rep Gains */)) {
      // Work for the company (assume daemon is grinding hack XP as fast as it can, so no point in studying for that)
      if (await fetch(ns, `ns.workForCompany('${companyName}')`, '/Temp/work-for-company.txt')) {
        lastActionRestart = Date.now();
        working = true;
      } else {
        announce(ns, `Something went wrong, failed to start working for company "${companyName}".`, 'error');
        break;
      }
    }
    if (lastStatus != status || (Date.now() - lastStatusUpdateTime) > statusUpdateInterval) {
      player = ns.getPlayer();
      ns.print(`Currently a "${player.jobs[companyName]}" ` +
        `('${currentRole}' #${currentJobTier}) for "${companyName}" ` +
        `earning ${(player.workRepGainRate * 5).toFixed(2)} rep/sec.\n` +
        `${status}\nCurrent player stats are ` +
        `Hack:${player.hacking} ${player.hacking >= (requiredHack || 0) ? '✓' : '✗'} ` +
        `Cha:${player.charisma} ${player.charisma >= (requiredCha || 0) ? '✓' : '✗'} ` +
        `Rep:${Math.round(currentReputation).toLocaleString()} ${currentReputation >= (requiredRep || repRequired) ? '✓' : '✗'}`);
      lastStatus = status;
      lastStatusUpdateTime = Date.now();
    }
    // Sleep now and wake up periodically and stop working to check our
    // stats / reputation progress
    await ns.sleep(loopSleepInterval);
  }
  // Return true if we succeeded, false otherwise.
  if (currentReputation >= repRequired) {
    ns.print(`Attained ${repRequired.toLocaleString()} rep with "${companyName}".`);
    if (!player.factions.includes(factionName) && waitForInvite)
      return await waitForFactionInvite(ns, factionName);
    return true;
  }
  ns.print(`Stopped working for "${companyName}" ` +
    `repRequiredForFaction: ${repRequired.toLocaleString()} ` +
    `currentReputation: ${Math.round(currentReputation).toLocaleString()} ` +
    `inFaction: ${player.factions.includes(factionName)}`)
  return false;
}
