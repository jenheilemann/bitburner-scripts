import { rootFiles, purchaseables,lsKeys } from "utils/constants.js"

/**
 * @param {integer} milliseconds to sleep
 * @cost 0 GB
 */
export function mySleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @returns {bool} access from a specified source file
 * @param {number} num - which source file we want to know about
 * @param {number} level (optional) - sometimes the specific functionality
 *                       requires the bitnode to be leveled up.
 * @cost 0 GB
 */
export function haveSourceFile(num, level = 1) {
  if ( getLSItem('reset').currentNode == num )
    return true

  let ownedSourceFiles = getLSItem('reset').ownedSF
  return ownedSourceFiles.get(num) && ownedSourceFiles.get(num) >= level
}

/**
 * Check if the user can use a singularity function
 * @params {num} level=1 Optionally choose the minimum level
 *
 * @cost 0 GB
 */
export function canUseSingularity(level = 1) {
  return haveSourceFile(4, level)
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
 * @cost 0 GB
 * @returns {integer} player's money available
 */
export function myMoney() {
  return getLSItem('player').money
}

/**
 * @param {NS} ns
 * @param {integer} cost - amount wanted
 * @cost 0.1 GB
 */
export function haveEnoughMoney(ns, cost) {
  if ((myMoney() - reserve(ns)) >= cost) {
    ns.print("I have enough: $" + ns.formatNumber(cost))
    return true;
  }
  ns.print("Don't have enough: $" + ns.formatNumber(cost + reserve(ns)))
  return false;
}

/**
 * Reserve a certain amount for big purchases
 * You can manually reserve an amount by setting a number in localStorage.
 *     run usr/lsSet.js reserve 4.5e9
 *
 * @param {NS} ns
 * @cost 0.1 GB
 */
export function reserve(ns) {
  let manualReserve = Number(getLSItem('reserve') || 0)
  for ( const file of purchaseables ) {
    if (!ns.fileExists(file.name, 'home')) {
      return file.cost + manualReserve
    }
  }
  return manualReserve
}

/**
 * @param {NS} ns
 * @param {function} callback
 * @cost 0 GB
 */
export async function tryRun(callback) {
  let pid = callback()
  while (pid == 0) {
    await mySleep(5)
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

  return item ? JSON.parse(item,jsonParseReviver) : undefined
}

export function jsonParseReviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value)
    }
    if (value.dataType === 'BigInt') {
      return BigInt(value.value)
    }
  }
  return value;
}

/**
 * @param {string} key
 * @param {any} value
 * @cost 0 GB
 **/
export function setLSItem(key, value) {
  localStorage.setItem(lsKeys[key.toUpperCase()], JSON.stringify(value, jsonStringifyReplacer))
}

export function jsonStringifyReplacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else if (typeof(value) == 'bigint') {
    return {
      dataType: 'BigInt',
      value: value.toString()
    }
  }else {
    return value;
  }
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


/**
 * @param {NS} ns
 * @cost 0 GB
 * Prints a message, and also toasts it!
 */
export function announce(ns, log, toastVariant = 'info') {
  // If an error is caught because the script is killed, ns becomes undefined
  checkNsInstance(ns);

  ns.print(`${toastVariant.toUpperCase()}: ${log}`);
  ns.toast(log, toastVariant.toLowerCase());
}


// yoink: https://gist.github.com/robmathers/1830ce09695f759bf2c4df15c29dd22d
/**
 * @param {array} data is an array of objects
 * @param {string|function} key is the key, property accessor, or callback
 *                          function to group by
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


// All of the below functions are stolen & reformatted/refactored from Insight's
// helper. They are required to make his scripts work.

/**
 * Return a formatted representation of the monetary amount using scale sympols
 * (e.g. $6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSigFigures - (default: 6) The maximum significant figures
 *                  you wish to see (e.g. 123, 12.3 and 1.23 all have 3
 *                  significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places
 *                  you wish to see, regardless of significant figures. (e.g.
 *                  12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatMoney(num, maxSigFigures = 6, maxDecimalPlaces = 3) {
    let numberShort = formatNumberShort(num, maxSigFigures, maxDecimalPlaces)
    return num >= 0 ? "$" + numberShort : numberShort.replace("-", "-$")
}

/**
 * Return a formatted representation of the monetary amount using scale sympols
 * (e.g. 6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSigFigures - (default: 6) The maximum significant figures
 *                  you wish to see (e.g. 123, 12.3 and 1.23 all have 3
 *                  significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places
 *                  you wish to see, regardless of significant figures. (e.g.
 *                  12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatNumberShort(num, maxSigFigures = 6, maxDecimalPlaces = 3) {
  const symbols = ["", "k", "m", "b", "t", "qa", "qi", "sx", "sp", "oc", "e30",
                  "e33", "e36", "e39"]
  const sign = Math.sign(num) < 0 ? "-" : ""
  for (var i = 0, num = Math.abs(num); num >= 1000 && i < symbols.length; i++) {
    num /= 1000
  }
  const sigFigs = maxSigFigures - Math.floor(1 + Math.log10(num))
  const fixed = num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, sigFigs)))
  return sign + fixed + symbols[i]
}

/**
 * Return a number formatted with the specified number of significatnt figures
 * or decimal places, whichever is more limiting.
 * @param {number} num - The number to format
 * @param {number=} minSigFigures - (default: 6) The minimum significant figures
 *                  you wish to see (e.g. 123, 12.3 and 1.23 all have 3
 *                  significant figures)
 * @param {number=} minDecimalPlaces - (default: 3) The minimum decimal places
 *                  you wish to see, regardless of significant figures. (e.g.
 *                  12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatNumber(num, minSigFigures = 3, minDecimalPlaces = 1) {
  if ( num == 0.0 )
    return  num

  let sigFigs = Math.max(0, minSigFigures - Math.ceil(Math.log10(num)))
  return num.toFixed(Math.max(minDecimalPlaces, sigFigs))
}

/**
 * Formats some RAM amount as a round number of GB with thousands separators
 * e.g. `1,028 GB`
 * @param {number} n - the number to format
 */
export function formatRam(n) {
  if (n < 1e3) return formatNumber(n, 3, 0) + 'GB'
  if (n < 1e6) return formatNumber(n / 1e3, 3, 0) + 'TB'
  if (n < 1e9) return formatNumber(n / 1e6, 3, 0) + 'PB'
  if (n < 1e12) return formatNumber(n / 1e9,3, 0) + 'EB'
  return `${Math.round(n).toLocaleString()} GB`;
}

/**
 * Format a duration (in milliseconds) as e.g. '1h 21m 6s' for big durations or
 * e.g '12.5s' / '23ms' for small durations
 **/
export function formatDuration(duration) {
    if (duration < 1000) return `${duration.toFixed(0)}ms`
    const portions = [];
    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);
    if (hours > 0) {
        portions.push(hours + 'h');
        duration -= (hours * msInHour);
    }
    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);
    if (minutes > 0) {
        portions.push(minutes + 'm');
        duration -= (minutes * msInMinute);
    }
    let seconds = (duration / 1000.0)
    // Include millisecond precision if we're on the order of seconds
    seconds = (hours == 0 && minutes == 0) ? seconds.toPrecision(3) : seconds.toFixed(0);
    if (seconds > 0) {
        portions.push(seconds + 's');
        duration -= (minutes * 1000);
    }
    return portions.join(' ');
}

/** Generate a hashCode for a string that is pretty unique most of the time */
export function hashCode(s) {
  return s.split("").reduce(function (a, b) {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
}

// FUNCTIONS THAT PROVIDE ALTERNATIVE IMPLEMENTATIONS TO EXPENSIVE NS FUNCTIONS
// VARIATIONS ON NS.RUN

/**
 * @param {NS} ns
 *  Use where a function is required to run a script and you have already
 * referenced ns.run in your script
 **/
export function getFnRunViaNsRun(ns) { return checkNsInstance(ns).run; }

/**
 * @param {NS} ns
 * Use where a function is required to run a script and you have already
 * referenced ns.exec in your script
 **/
export function getFnRunViaNsExec(ns, host = "home") {
  checkNsInstance(ns);
  return function (scriptPath, ...args) {
    return ns.exec(scriptPath, host, ...args)
  }
}
// VARIATIONS ON NS.ISRUNNING

/**
 * @param {NS} ns
 * Use where a function is required to check if a script is running and you have
 * already referenced ns.isRunning in your script
 **/
export function getFnIsAliveViaNsIsRunning(ns) {
  return checkNsInstance(ns).isRunning
}

/**
 * @param {NS} ns
 * Use where a function is required to check if a script is running and you have
 * already referenced ns.ps in your script
 **/
export function getFnIsAliveViaNsPs(ns) {
  checkNsInstance(ns);
  return function (pid, host) {
    return ns.ps(host).some(process => process.pid === pid)
  }
}

/**
 * Evaluate an arbitrary ns command by writing it to a new script and then
 * running or executing the new file
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {string} command - The ns command that should be invoked to get the
 *                 desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fileName - (default "/Temp/{commandhash}-data.txt") The name
 *                  of the file to which data will be written to disk by a
 *                  temporary process
 * @param {bool=} verbose - (default false) If set to true, the evaluation
 *                result of the command is printed to the terminal
 * @param {...args} args - args to be passed in as arguments to command being
 *                  run as a new script.
 */
export function runCommand(ns, command, fileName, verbose, ...args) {
  checkNsInstance(ns)
  if (!verbose) disableLogs(ns, ['run', 'sleep'])
  return runCommand_Custom(ns, ns.run, command,fileName, verbose, ...args)
}

/**
 * Evaluate an arbitrary ns command by writing it to a new script, running the
 * script, then waiting for it to complete running.
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {string} command - The ns command that should be invoked to get the
 *                           desired result (e.g. "ns.exec('nuker.js', 'home')")
 * @param {string=} fileName - (default "/Temp/{commandhash}-data.txt") The name
 *                             of the file to which data will be written to disk
 *                             by a temporary process
 * @param {bool=} verbose - (default false) If set to true, the evaluation
 *                          result of the command is printed to the terminal
 * @param {...args} args - args to be passed in as arguments to command being
 *                         run as a new script
 */
export async function runCommandAndWait(ns, command, fileName, verbose, ...args) {
  checkNsInstance(ns)
  if (!verbose) disableLogs(ns, ['run', 'sleep'])

  const pid = runCommand_Custom(ns,ns.run,command,fileName,verbose,...args)
  if (pid === 0) {
    throw (`runCommand returned no pid. (Insufficient RAM, or bad command?) ` +
      `Destination: ${fileName} Command: ${command}`)
  }
  await waitForProcessToComplete_Custom(ns, ns.isRunning, pid, verbose)
}

/**
 * An advanced version of runCommand that lets you pass your own "isAlive" test
 * to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 *
 * Importing incurs 0 GB RAM (assuming fnRun, fnWrite are implemented using
 * another ns function you already reference elsewhere like ns.exec)
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {function} fnRun - A single-argument function used to start the new
 *                   script, e.g. `ns.run` or
 *                   `(f,...args) => ns.exec(f, "home", ...args)`
 * @param {string} command - The ns command that should be invoked to get the
 *                 desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fileName - (default "/Temp/{commandhash}-data.txt") The name
 *                  of the file to which data will be written to disk by a
 *                  temporary process
 * @param {bool=} verbose - (default false) If set to true, the evaluation
 *                result of the command is printed to the terminal
 * @param {...args} args - args to be passed in as arguments to command being
 *                  run as a new script.
 **/
export function runCommand_Custom(ns, fnRun, command, fileName, verbose, ...args) {
  checkNsInstance(ns)
  const script =
    `import { mySleep, haveSourceFile, canUseSingularity, toolsCount,disableLogs,` +
    `myMoney,haveEnoughMoney,reserve,tryRun,getLSItem,setLSItem,jsonStringifyReplacer,`+
    `jsonParseReviver,clearLSItem,fetchPlayer,announce,groupBy,formatMoney,`+
    `formatNumberShort,formatNumber,formatRam,formatDuration,hashCode,getFnRunViaNsRun,` +
    `getFnRunViaNsExec,getFnIsAliveViaNsIsRunning,getFnIsAliveViaNsPs,runCommand,` +
    `runCommandAndWait,runCommand_Custom,waitForProcessToComplete,waitForProcessToComplete_Custom,` +
    `getNsDataThroughFile,getNsDataThroughFile_Custom,checkNsInstance } from 'utils/helpers.js';\n` +
    `import {networkMap, networkMapFree, fetchServer, fetchServerFree } from 'utils/network.js';\n` +
    `import * as constants from 'utils/constants.js';\n` +
    `export async function main(ns) {
      try
        { ` + (verbose ? `let output = ${command}; ns.tprint(output)` : command) + `; }
      catch(err) { ns.tprint(String(err)); throw(err); }
    }`;
  fileName = fileName || `/Temp/${hashCode(command)}-command.js`;
  // To improve performance and save on garbage collection, we can skip
  // writing this exact same script was previously written (common for
  // repeatedly-queried data)
  if (ns.read(fileName) != script) {
    ns.write(fileName, script, "w")
  }
  return fnRun(fileName, ...args)
}

/**
 * Wait for a process id to complete running
 * Importing incurs a maximum of 0.1 GB RAM (for ns.isRunning)
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {int} pid - The process id to monitor
 * @param {bool=} verbose - (default false) If set to true, pid and result of
 *                command are logged.
 **/
export async function waitForProcessToComplete(ns, pid, verbose) {
    checkNsInstance(ns)
    if (!verbose) disableLogs(ns, ['isRunning'])
    return await waitForProcessToComplete_Custom(ns, ns.isRunning, pid, verbose)
}
/**
 * An advanced version of waitForProcessToComplete that lets you pass your own
 * "isAlive" test to reduce RAM requirements (e.g. to avoid referencing
 * ns.isRunning)
 *
 * Importing incurs 0 GB RAM (assuming fnIsAlive is implemented using another ns
 * function you already reference elsewhere like ns.ps)
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {function} fnIsAlive - A single-argument function used to test, e.g.
 *                   `ns.isRunning` or
 *                   `pid => ns.ps("home").some(process => process.pid === pid)`
 **/
export async function waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose) {
  checkNsInstance(ns);
  if (!verbose) disableLogs(ns, ['sleep']);
  // Wait for the PID to stop running (cheaper than e.g. deleting (rm) a
  // possibly pre-existing file and waiting for it to be recreated)
  for (var retries = 0; retries < 1000; retries++) {
    if (!fnIsAlive(pid)) break; // Script is done running
    if (verbose && retries % 100 === 0) {
      ns.print(`Waiting for pid ${pid} to complete... (${retries})`)
    }
    await ns.sleep(10);
  }
  // Make sure that the process has shut down and we haven't just stopped retrying
  if (fnIsAlive(pid)) {
    let error = `run-command pid ${pid} is running much longer than expected. `+
      `Max retries exceeded.`
    ns.print(error)
    throw error
  }
}

/**
 * Retrieve the result of an ns command by executing it in a temporary .js
 * script, writing the result to a file, then shuting it down
 *
 * Importing incurs a maximum of 1.1 GB RAM (0 GB for ns.read, 1 GB for ns.run,
 * 0.1 GB for ns.isRunning).
 *
 * Has the capacity to retry if there is a failure (e.g. due to lack of RAM
 * available). Not recommended for performance-critical code.
 *
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {string} command - The ns command that should be invoked to get the
 *                 desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fName - (default "/Temp/{commandhash}-data.txt") The name
 *                  of the file to which data will be written to disk by a
 *                  temporary process
 * @param {bool=} verbose - (default false) If set to true, pid and result of
 *                command are logged.
 * @param {integer} maxRetries - (default 5) How many times to retry for not
 *                  more RAM before throwing an error
 * @param {integer} retryDelayMs - (default 50) How many milliseconds to wait
 *                  before retrying
 **/
export async function getNsDataThroughFile(ns, command, fName, verbose, maxRetries = 5, retryDelayMs = 50) {
    checkNsInstance(ns)
    if (!verbose) disableLogs(ns, ['run', 'isRunning'])
    return await getNsDataThroughFile_Custom(ns,
                                             ns.run,
                                             ns.isRunning,
                                             command,
                                             fName,
                                             verbose,
                                             maxRetries,
                                             retryDelayMs)
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
 * @param {NS} ns - The nestcript instance passed to your script
 * @param {function} fnRun - A single-argument function used to start the new
 *                   script, e.g. `ns.run` or
 *                   `(f,...args) => ns.exec(f, "home", ...args)`
 * @param {function} fnIsAlive - A single-argument function used to test if the
 *                   script has completed, e.g. `ns.isRunning` or
 *                   `pid => ns.ps("home").some(process => process.pid === pid)`
 * @param {string} command - The ns command that should be invoked to get the
 *                 desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fName - (default "/Temp/{commandhash}-data.txt") The name
 *                  of the file to which data will be written to disk by a
 *                  temporary process
 * @param {bool=} verbose - (default false) If set to true, pid and result of
 *                command are logged.
 * @param {integer} maxRetries - (default 5) How many times to retry for not
 *                  more RAM before throwing an error
 * @param {integer} retryDelayMs - (default 50) How many milliseconds to wait
 *                  before retrying
 **/
export async function getNsDataThroughFile_Custom(ns, fnRun, fnIsAlive, command, fName, verbose, maxRetries = 5, retryDelayMs = 50) {
  checkNsInstance(ns);
  if (!verbose) disableLogs(ns, ['read'])
  const commandHash = hashCode(command)
  fName = fName || `/Temp/${commandHash}-data.txt`
  const fNameCommand = (fName || `/Temp/${commandHash}-command`) + '.js'
  // Prepare a command that will write out a new file containing the results of
  // the command unless it already exists with the same contents
  // (saves time/ram to check first)
  const commandToFile = `const result = JSON.stringify(${command}, jsonStringifyReplacer); ` +
    `if (ns.read("${fName}") != result) await ns.write("${fName}", result, 'w')`
  while (maxRetries-- > 0) {
    try {
      const pid = runCommand_Custom(ns, fnRun, commandToFile, fNameCommand, false)
      if (pid === 0) {
        throw (`runCommand returned no pid. (Insufficient RAM, or bad command?) `
          +`Destination: ${fNameCommand} Command: ${commandToFile}`)
      }
      await waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose)
      if (verbose) {
        ns.print(`Process ${pid} is done. Reading the contents of ${fName}...`)
      }

      // Read the output of the other script
      const fileData = ns.read(fName)
      if (fileData === undefined) {
        throw (`ns.read('${fName}') somehow returned undefined`)
      }
      if (fileData === "") {
        throw (`The expected output file ${fName} is empty.`)
      }
      if (verbose) {
        ns.print(`Read the following data for command ${command}:\n${fileData}`)
      }
      // Deserialize it back into an object/array and return
      return JSON.parse(fileData, jsonParseReviver)
    }
    catch (error) {
      const errorLog = `getNsDataThroughFile error (${maxRetries} retries ` +
        `remaining): ${String(error)}`
      const type =  maxRetries > 0 ? 'warning' : 'error'
      announce(ns, errorLog, type)
      if (maxRetries <= 0) {
        throw error
      }
      await ns.sleep(retryDelayMs)
    }
  }
}

/** @param {NS} ns **/
export function checkNsInstance(ns) {
  if (!ns.read)
    throw "The first argument to this function should be a 'ns' instance."
  return ns
}
