import { rootFiles, purchaseables,lsKeys } from "constants.js"

export function toolsCount() {
  let player = getLSItem('player')
  return (rootFiles.filter((file) => player.programs.includes(file.name))).length
}

export function disableLogs(ns, functions) {
  functions.forEach((funct) => ns.disableLog(funct))
}

function myMoney(ns) {
  return ns.getServerMoneyAvailable('home')
}

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

export function reserve(ns) {
  for ( const file of purchaseables ) {
    if (!ns.fileExists(file.name, 'home')) {
      return file.cost
    }
  }
  return 0
}

export async function tryRun(ns, callback) {
  let pid = callback()
  while (pid == 0) {
    await ns.sleep(300)
    pid = callback()
  }
  return pid
}

export function getLSItem(key) {
  let item = localStorage.getItem(lsKeys[key.toUpperCase()])

  return item ? JSON.parse(item) : undefined
}

export function setLSItem(key, value) {
  localStorage.setItem(lsKeys[key.toUpperCase()], JSON.stringify(value))
}

export function clearLSItem(key) {
  localStorage.removeItem(lsKeys[key.toUpperCase()])
}

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

    // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
    storage[group] = storage[group] || [];

    // add this item to its group within `storage`
    storage[group].push(item);

    // return the updated storage to the reduce function,
    //which will then loop through the next
    return storage;
  }, {}); // {} is the initial value of the storage
};
