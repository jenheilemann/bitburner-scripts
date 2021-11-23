import { rootFiles, purchaseables,lsKeys } from "constants.js"

/**
 * @param {integer} milliseconds to sleep
 * @cost 0 GB
 */
export function mySleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @returns {integer} number of exe rootfiles on the player's computer
 * @cost 0 GB
 */
export function toolsCount() {
  let player = getLSItem('player')
  return (rootFiles.filter((file) => player.programs.includes(file.name))).length
}

/**
 * @param {NS} ns
 * @param {array} list of loggable functions to disable
 * @cost 0 GB
 */
export function disableLogs(ns, listOfLogs) {
  ['disableLog'].concat(...listOfLogs).forEach(log => ns.disableLog(log));
}

/**
 * @param {NS} ns
 * @cost 0.1 GB
 * @returns {integer} player's money available
 */
function myMoney(ns) {
  return ns.getServerMoneyAvailable('home')
}

/**
 * @param {NS} ns
 * @param {integer} cost - amount wanted
 * @cost 0.2 GB
 */
export async function waitForCash(ns, cost) {
  if ((myMoney(ns) - reserve(ns)) >= cost) {
    ns.print("I have enough: " + ns.nFormat(cost, "$0.000a"))
    return;
  }
  ns.print("Waiting for " + ns.nFormat(cost + reserve(ns), "$0.000a"))
  while ((myMoney(ns) - reserve(ns)) < cost) {
    await ns.sleep(3000)
  }
}

/**
 * Reserve a certain amount for big purchases
 * @param {NS} ns
 * @cost 0.1 GB
 */
export function reserve(ns) {
  for ( const file of purchaseables ) {
    if (!ns.fileExists(file.name, 'home')) {
      return file.cost
    }
  }
  return 0
}


/**
 * @param {NS} ns
 * @param {function} callback
 * @cost 0 GB
 */
export async function tryRun(ns, callback) {
  let pid = callback()
  while (pid == 0) {
    await ns.sleep(30)
    pid = callback()
  }
  return pid
}

/**
 * @param {string} key
 * @return {any} The value read from localStorage
 * @cost 0 GB
 **/
export function getLSItem(key) {
  let item = localStorage.getItem(lsKeys[key.toUpperCase()])

  return item ? JSON.parse(item) : undefined
}

/**
 * @param {string} key
 * @param {any} value
 * @cost 0 GB
 **/
export function setLSItem(key, value) {
  localStorage.setItem(lsKeys[key.toUpperCase()], JSON.stringify(value))
}

/**
 * @param {string} key
 * @cost 0 GB
 **/
export function clearLSItem(key) {
  localStorage.removeItem(lsKeys[key.toUpperCase()])
}

/**
 * @return {object} The player data from localStorage
 * @cost 0 GB
 **/
export function fetchPlayer() {
  return getLSItem('player')
}

// yoink: https://gist.github.com/robmathers/1830ce09695f759bf2c4df15c29dd22d
/**
 * @param {array} data is an array of objects
 * @param {string|function} key is the key, property accessor, or callback
 * function to group by
**/
export function groupBy(data, key) {
  // reduce runs this anonymous function on each element of `data`
  // (the `item` parameter, returning the `storage` parameter at the end
  return data.reduce(function(storage, item) {
    // get the first instance of the key by which we're grouping
    var group = key instanceof Function ? key(item) : item[key];

    // set `storage` for this instance of group to the outer scope (if not
    // empty) or initialize it
    storage[group] = storage[group] || [];

    // add this item to its group within `storage`
    storage[group].push(item);

    // return the updated storage to the reduce function,
    //which will then loop through the next
    return storage;
  }, {}); // {} is the initial value of the storage
};


/** Generate a hashCode for a string that is pretty unique most of the time */
export function hashCode(s) { return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0); }

// FUNCTIONS THAT PROVIDE ALTERNATIVE IMPLEMENTATIONS TO EXPENSIVE NS FUNCTIONS
// VARIATIONS ON NS.RUN

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.run in your script **/
export function getFnRunViaNsRun(ns) { return checkNsInstance(ns).run; }

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.exec in your script **/
export function getFnRunViaNsExec(ns, host = "home") {
    checkNsInstance(ns);
    return function (scriptPath, ...args) { return ns.exec(scriptPath, host, ...args); }
}
// VARIATIONS ON NS.ISRUNNING

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.run in your script  */
export function getFnIsAliveViaNsIsRunning(ns) { return checkNsInstance(ns).isRunning; }

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.exec in your script  */
export function getFnIsAliveViaNsPs(ns) {
    checkNsInstance(ns);
    return function (pid, host) { return ns.ps(host).some(process => process.pid === pid); }
}

/** Evaluate an arbitrary ns command by writing it to a new script and then running or executing it.
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {string} command - The ns command that should be invoked to get the desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fileName - (default "/Temp/{commandhash}-data.txt") The name of the file to which data will be written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, the evaluation result of the command is printed to the terminal
 * @param {...args} args - args to be passed in as arguments to command being run as a new script.
 */
export async function runCommand(ns, command, fileName, verbose, ...args) {
    if (ns.run === undefined) throw "The first argument to runCommand should be the ns instance. (Did you mean to use runCommand_Custom?)"
    if (!verbose) disableLogs(ns, ['run', 'sleep']);
    return await runCommand_Custom(ns, ns.run, command, fileName, verbose, ...args);
}

/**
 * An advanced version of runCommand that lets you pass your own "isAlive" test to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 * Importing incurs 0 GB RAM (assuming fnRun, fnWrite are implemented using another ns function you already reference elsewhere like ns.exec)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {function} fnRun - A single-argument function used to start the new sript, e.g. `ns.run` or `(f,...args) => ns.exec(f, "home", ...args)`
 **/
export async function runCommand_Custom(ns, fnRun, command, fileName, verbose, ...args) {
    checkNsInstance(ns);
    let script = `export async function main(ns) { try { ` +
        (verbose ? `let output = ${command}; ns.tprint(output)` : command) +
        `; } catch(err) { ns.tprint(String(err)); throw(err); } }`;
    fileName = fileName || `/Temp/${hashCode(command)}-command.js`;
    // To improve performance and save on garbage collection, we can skip writing this exact same script was previously written (common for repeatedly-queried data)
    if (ns.read(fileName) != script) await ns.write(fileName, script, "w");
    return fnRun(fileName, ...args);
}
const _cachedTempScripts = [];

/**
 * Wait for a process id to complete running
 * Importing incurs a maximum of 0.1 GB RAM (for ns.isRunning)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {int} pid - The process id to monitor
 * @param {bool=} verbose - (default false) If set to true, pid and result of command are logged.
 **/
export async function waitForProcessToComplete(ns, pid, verbose) {
    checkNsInstance(ns);
    if (!verbose) disableLogs(ns, ['isRunning']);
    return await waitForProcessToComplete_Custom(ns, ns.isRunning, pid, verbose);
}
/**
 * An advanced version of waitForProcessToComplete that lets you pass your own "isAlive" test to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 * Importing incurs 0 GB RAM (assuming fnIsAlive is implemented using another ns function you already reference elsewhere like ns.ps)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {function} fnIsAlive - A single-argument function used to start the new sript, e.g. `ns.isRunning` or `pid => ns.ps("home").some(process => process.pid === pid)`
 **/
export async function waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose) {
    checkNsInstance(ns);
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
 * Retrieve the result of an ns command by executing it in a temporary .js script, writing the result to a file, then shuting it down
 * Importing incurs a maximum of 1.1 GB RAM (0 GB for ns.read, 1 GB for ns.run, 0.1 GB for ns.isRunning).
 * Has the capacity to retry if there is a failure (e.g. due to lack of RAM available). Not recommended for performance-critical code.
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {string} command - The ns command that should be invoked to get the desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fName - (default "/Temp/{commandhash}-data.txt") The name of the file to which data will be written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, pid and result of command are logged.
 **/
export async function getNsDataThroughFile(ns, command, fName, verbose, maxRetries = 5, retryDelayMs = 50) {
    checkNsInstance(ns);
    if (!verbose) disableLogs(ns, ['run', 'isRunning']);
    return await getNsDataThroughFile_Custom(ns, ns.run, ns.isRunning, command, fName, verbose, maxRetries, retryDelayMs);
}
/**
 * An advanced version of getNsDataThroughFile that lets you pass your own
 * "fnRun" and "fnIsAlive" implementations to reduce RAM requirements
 *
 * Importing incurs no RAM (now that ns.read is free) plus whatever fnRun /
 * fnIsAlive you provide it
 *
 * Has the capacity to retry if there is a failure (e.g. due to lack of RAM
 * available). Not recommended for performance-critical code.
 *
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {function} fnRun - A single-argument function used to start the new sript, e.g. `ns.run` or `(f,...args) => ns.exec(f, "home", ...args)`
 * @param {function} fnIsAlive - A single-argument function used to start the new sript, e.g. `ns.isRunning` or `pid => ns.ps("home").some(process => process.pid === pid)`
 **/
export async function getNsDataThroughFile_Custom(ns, fnRun, fnIsAlive, command, fName, verbose, maxRetries = 5, retryDelayMs = 50) {
  checkNsInstance(ns);
  if (!verbose) disableLogs(ns, ['read']);
  const commandHash = hashCode(command);
  fName = fName || `/Temp/${commandHash}-data.txt`;
  const fNameCommand = (fName || `/Temp/${commandHash}-command`) + '.js'
  // Prepare a command that will write out a new file containing the results of the command unless it already exists with the same contents (saves time/ram to check first)
  const commandToFile = `const result = JSON.stringify(${command}); if (ns.read("${fName}") != result) await ns.write("${fName}", result, 'w')`;
  while (maxRetries-- > 0) {
    try {
      const pid = await runCommand_Custom(ns, fnRun, commandToFile, fNameCommand, false);
      if (pid === 0) throw (`runCommand returned no pid. (Insufficient RAM, or bad command?) Destination: ${fNameCommand} Command: ${commandToFile}`);
      await waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose);
      if (verbose) ns.print(`Process ${pid} is done. Reading the contents of ${fName}...`);
      const fileData = ns.read(fName); // Read the output of the other script
      if (fileData === undefined) throw (`ns.read('${fName}') somehow returned undefined`);
      if (fileData === "") throw (`The expected output file ${fName} is empty.`);
      if (verbose) ns.print(`Read the following data for command ${command}:\n${fileData}`);
      return JSON.parse(fileData); // Deserialize it back into an object/array and return
    }
    catch (error) {
      const errorLog = `getNsDataThroughFile error (${maxRetries} retries remaining): ${String(error)}`
      ns.print(errorLog);
      ns.toast(errorLog, maxRetries > 0 ? 'warning' : 'error');
      if (maxRetries <= 0) throw error;
      await ns.sleep(retryDelayMs);
    }
  }
}

/** @param {NS} ns **/
export function checkNsInstance(ns) {
  if (!ns.sleep)
    throw "The first argument to this function should be a 'ns' instance."
  return ns
}
