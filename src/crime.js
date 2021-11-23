const crimes = [
  "shoplift",
  "rob store",
  "mug",
  "larceny",
  "deal drugs",
  "bond forgery",
  "traffick arms",
  "homicide",
  "grand theft auto",
  "kidnap",
  "assassinate",
  "heist",
]

const combatXPStats = [
  'strength_exp',
  'defense_exp',
  'dexterity_exp',
  'agility_exp'
]

const xpStats = [
  'hacking_exp',
  'charisma_exp',
  'intelligence_exp'
].concat(combatXPStats)

export function autocomplete(data, args) {
  return crimes.concat([
    'money',
    'xp',
    'karma',
    'hacking',
    'combat',
    'charisma'
  ])
}

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  ns.tail()
  let args = ns.flags([['focus', 'money']])
  let time = 1, again = true, crime
  let karma =  ns.heart.break()

  while (again) {
    crime = await chooseCrime(ns, args)
    time = await fetch(ns, `ns.commitCrime('${crime}')`)
    ns.print(`Attempting ${crime} in ${ns.tFormat(time)}...`)
    await ns.sleep(time * 0.75)

    again = fetchPlayer().busy
    while (fetchPlayer().busy) {
      await ns.sleep(50)
    }
    if ( ns.heart.break() > karma ){
      ns.print(`SUCCESS: ${crime}`)
    } else {
      ns.print(`FAILURE: ${crime}`)
    }
    ns.print('karma: ', karma = ns.heart.break())
  }
}

async function chooseCrime(ns, args) {
  if (args._.length > 0 && crimes.includes(args._[0].toLowerCase())) {
    return args._[0].toLowerCase()
  }
  const stats = []
  let score = 0
  for ( let crime of crimes ) {
    score = await calcScore(ns, args.focus, crime)
    stats.push({name: crime, score: score})
  }
  let sorted = stats.sort((a, b) =>  b.score - a.score)
  return sorted[0].name
}

async function calcScore(ns, focus, crime) {
  let stats = await fetch(ns, `ns.getCrimeStats('${crime}')`, `/Temp/crimeStats.txt`)
  let value = focusValue(focus, stats)
  let chance = await fetch(ns, `ns.getCrimeChance('${crime}')`,`/Temp/crimeChance.txt`)

  return chance * value / stats.time
}

function focusValue(focus, stats) {
  switch (focus) {
    case 'karma':
      return stats.karma
    case 'xp':
      return xpStats.reduce((prev, name) => stats[name] + prev, 0)
    case 'hacking':
      return stats.hacking_exp
    case 'combat':
      return combatXPStats.reduce((p, name) => stats[name] + prev, 0)
    case 'charisma':
      return stats.charisma_exp
    default:
      return stats.money
  }
}



export function fetchPlayer() {
  let item = localStorage.getItem('jh_player')
  return item ? JSON.parse(item) : undefined
}

async function fetch(ns, cmd, filename) {
  return await getNsDataThroughFile(ns, cmd, filename)
}


export function disableLogs(ns, listOfLogs) {
  ['disableLog'].concat(...listOfLogs).forEach(log => ns.disableLog(log));
}

/** Generate a hashCode for a string that is pretty unique most of the time */
export function hashCode(s) {
  return s.split("").reduce(function (a, b) {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0);
}

// FUNCTIONS THAT PROVIDE ALTERNATIVE IMPLEMENTATIONS TO EXPENSIVE NS FUNCTIONS


// VARIATIONS ON NS.RUN
/**
 * Use where a function is required to run a script and you have already
 * referenced ns.run in your script
 */
export function getFnRunViaNsRun(ns) { return ns.run; }

/**
 * Use where a function is required to run a script and you have already
 * referenced ns.exec in your script
 */
export function getFnRunViaNsExec(ns, host = "home") {
  return function (scriptPath, ...args) { return ns.exec(scriptPath, host, ...args); }
}


// VARIATIONS ON NS.ISRUNNING
/**
 * Use where a function is required to run a script and you have already
 * referenced ns.run in your script
 */
export function getFnIsAliveViaNsIsRunning(ns) { return ns.isRunning; }

/**
 * Use where a function is required to run a script and you have already
 * referenced ns.exec in your script
 */
export function getFnIsAliveViaNsPs(ns) {
  return function (pid, host) {
    return ns.ps(host).some(process => process.pid === pid);
  }
}


// VARIATIONS ON NS.WRITE
/**
 * Use where a function is required to write a file and you have already
 * referenced ns.write in your script
 */
export function getFnWriteViaNsWrite(ns) { return ns.write; }


const writeFilejs = '/Tasks/write-file.js';
/**
 * Use where a function is required to write a file and you have already
 * referenced some fnRun and some fnIsAlive in your script
 */
export function getFnWriteViaRunAndMonitor(ns, fnRun, fnIsAlive) {
  return async function (...args) {
    let pidWriteFile = fnRun(writeFilejs, 1, ...args);
    if (!pidWriteFile)
      throw `fnRun returned a pid of ${pidWriteFile}. ` +
      `This indicates a failure to run '${writeFilejs}', or a bad fnRun ` +
      `implementation. Args were: ${JSON.stringify(args)}`;
    await waitForProcessToComplete_Custom(ns, fnIsAlive, pidWriteFile, false);
  }
}

/**
 * Use where a function is required to write a file and you have already
 * referenced some fnRun, and are willing to sleep for some time and hope it
 * completed by then
 *
 * @param {int=200} sleepDelayMilliseconds - should hopefully be enough for a
 *                                           new process to start, await the
 *                                           write, and complete.
 */
export function getFnWriteViaRunAndSleep(ns, fnRun, sleepDelayMilliseconds = 200) {
  return async function (...args) {
    fnRun(writeFilejs, 1, ...args);
    await ns.sleep(sleepDelayMilliseconds);
  }
}

/** Evaluate an arbitrary ns command by writing it to a new script and then running or executing it.
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {string} command - The ns command that should be invoked to get the desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fileName - (default "/Temp/{commandhash}-data.txt") The name of the file to which data will be written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, the evaluation result of the command is printed to the terminal
 * @param {...args} args - args to be passed in as arguments to command being run as a new script.
 */
export async function runCommand(ns, command, fileName, verbose, ...args) {
  if (ns.run === undefined)
    throw "The first argument to runCommand should be the ns instance. (Did you mean to use runCommand_Custom?)"
  if (!verbose) disableLogs(ns, ['run', 'sleep']);
  return await runCommand_Custom(ns.run, getFnWriteViaRunAndSleep(ns, ns.run), command, fileName, verbose, ...args);
}

/**
 * An advanced version of runCommand that lets you pass your own "isAlive" test to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 * Importing incurs 0 GB RAM (assuming fnRun, fnWrite are implemented using another ns function you already reference elsewhere like ns.exec)
 * @param {function} fnRun - A single-argument function used to start the new sript, e.g. `ns.run` or `(f,...args) => ns.exec(f, "home", ...args)`
 * @param {function} fnWrite - An async function used to write a file, e.g. `ns.write` or `fnWriteViaRun`
 **/
export async function runCommand_Custom(fnRun, fnWrite, command, fileName, verbose, ...args) {
  command = verbose ? `let output = ${command}; ns.tprint(output)` : command
  let script =
    `export async function main(ns) {
    try { ` + command + `; }
    // Either print the output of the test command,
    // or the error it got when running it.
    catch(err) { ns.tprint(String(err)); throw(err); }
  }`;
  fileName = fileName || `/Temp/${hashCode(command)}-command.js`;
  await fnWrite(fileName, script, "w");
  return fnRun(fileName, ...args);
}

/**
 * Wait for a process id to complete running
 * Importing incurs a maximum of 0.1 GB RAM (for ns.isRunning)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {int} pid - The process id to monitor
 * @param {bool=} verbose - (default false) If set to true, pid and result of command are logged.
 **/
export async function waitForProcessToComplete(ns, pid, verbose) {
  if (ns.isRunning === undefined)
    throw "The first argument to waitForProcessToComplete should be the ns instance."
  if (!verbose) disableLogs(ns, ['isRunning']);
  return await waitForProcessToComplete_Custom(ns, ns.isRunning, pid, verbose);
}
/**
 * An advanced version of waitForProcessToComplete that lets you pass your own "isAlive" test to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 * Importing incurs 0 GB RAM (assuming fnIsAlive is implemented using another ns function you already reference elsewhere like ns.ps)
 * @param {function} fnIsAlive - A single-argument function used to start the new sript, e.g. `ns.isRunning` or `pid => ns.ps("home").some(process => process.pid === pid)`
 **/
export async function waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose) {
  if (!verbose) disableLogs(ns, ['sleep']);
  // Wait for the PID to stop running (cheaper than e.g. deleting (rm) a possibly pre-existing file and waiting for it to be recreated)
  for (var retries = 0; retries < 1000; retries++) {
    if (!fnIsAlive(pid)) break; // Script is done running
    if (verbose && retries % 100 === 0) ns.print(`Waiting for pid ${pid} to complete... (${retries})`);
    await ns.sleep(10);
  }
  // Make sure that the process has shut down and we haven't just stopped retrying
  if (fnIsAlive(pid)) {
    let errorMessage = `run-command pid ${pid} is running much longer than expected. Max retries exceeded.`;
    ns.print(errorMessage);
    throw errorMessage;
  }
}

/**
 * Retrieve the result of an ns command by executing it in a temporary .js
 * script, writing the result to a file, then shuting it down
 *
 * Importing incurs a maximum of 2.1 GB RAM (1 GB for ns.read, 1 GB for
 * ns.run, 0.1 GB for ns.isRunning)
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {string} command - The ns command that will be invoked to get data
 *                           (e.g. "ns.getServer('home')" )
 * @param {string=} fName - (default "/Temp/{commandhash}-data.txt")
 *                          The name of the file to which data will be
 *                          written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, pid and result
 *                          of command are logged.
 **/
export async function getNsDataThroughFile(ns, command, fName, verbose) {
  if (ns.run === undefined) {
    throw "The first argument to getNsDataThroughFile should be the ns instance."
  }
  if (!verbose) {
    disableLogs(ns, ['run', 'isRunning']);
  }
  return await getNsDataThroughFile_Custom(ns, ns.run, ns.isRunning, command, fName, verbose);
}
/**
 * An advanced version of getNsDataThroughFile that lets you pass your own
 * "fnRun" and "fnIsAlive" implementations to reduce RAM requirements
 *
 * Importing incurs a maximum of 1 GB RAM (for ns.read) plus whatever
 * fnRun/fnIsAlive you provide it. Miraculously, does not need to pay
 * for ns.write
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {function} fnRun - A single-argument function used to start the
 *                           new sript, e.g. `ns.run` or
 *                           `(f,...args) => ns.exec(f, "home", ...args)`
 * @param {function} fnIsAlive - A single-argument function used to start
 *                   the new sript, e.g. `ns.isRunning` or
 *                   `pid => ns.ps("home").some(process => process.pid === pid)`
 * @param {string} command - The ns command that will be invoked to get data
 *                           (e.g. "ns.getServer('home')" )
 * @param {string=} fName - (default "/Temp/{commandhash}-data.txt")
 *                          The name of the file to which data will be
 *                          written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, pid and result
 *                          of command are logged.
 **/
export async function getNsDataThroughFile_Custom(ns, fnRun, fnIsAlive, cmd, fName, verbose) {
  if (!verbose) disableLogs(ns, ['read']);
  let errorMessage = null;

  let commandHash = hashCode(cmd);
  fName = fName || `/Temp/${commandHash}-data.txt`;
  let fNameCommand = (fName || `/Temp/${commandHash}-command`) + '.js'
  let commandToFile = `await ns.write("${fName}", JSON.stringify(${cmd}), 'w')`
  const fnWrite = getFnWriteViaRunAndMonitor(ns, fnRun, fnIsAlive)

  const pid = await runCommand_Custom(fnRun, fnWrite, commandToFile, fNameCommand, false);
  if (pid === 0) {
    ns.print(errorMessage = `Something went wrong running run-command. ` +
      `(Insufficient RAM, or bad command?)\n` +
      `Command: ${commandToFile}\nDestination: ${fNameCommand}`)
    throw errorMessage;
  }
  await waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose)

  // Read the output of the other script
  if (verbose) {
    ns.print(`Process ${pid} is done. Reading the contents of ${fName}...`)
  }

  const fileData = ns.read(fName);
  if (fileData === undefined) {
    ns.print(errorMessage = `ns.read('${fName}') somehow returned undefined`);
    throw errorMessage;
  } else if (fileData === "") {
    ns.print(errorMessage = `The expected output file ${fName} is empty.`);
    throw errorMessage;
  }
  if (verbose) ns.print(`Read the following data for command ${cmd}:\n${fileData}`);
  // Deserialize it back into an object/array and return
  return JSON.parse(fileData);
}
