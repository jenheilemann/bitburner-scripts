import {
          disableLogs,
          getLSItem,
          announce,
        } from 'helpers.js'
// magic number (Ram required to run hack.js)
const hackingScriptSize = 1.7
const scripts = ['breadwinner.js', 'batchGrow.js', 'batchHack.js', 'batchWeaken.js']

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  disableLogs(ns, ['sleep', 'scp'])
  let servers = fetchZombifyableServers(ns)
  if (!servers) return

  ns.tprint("Zombifying " + servers.length + " servers")
  var success = []
  var failure = []
  for (let server of servers) {
    var res = await zombify(ns, server.name)
    res ? success.push(server) : failure.push(server)
    await ns.sleep(50)
  }
  if (success.length > 0 ) {
    let msg = `Zombified servers: ${success.map(s => s.name).join(', ')}`
    announce(ns, msg)
    ns.tprint(msg)
  }
  if (failure.length > 0 ) {
    let msg = `ERROR: failed to zombify servers: ${failure.map(s => s.name).join(', ')}`
    announce(ns, msg)
    ns.tprint(msg)
  }
}


/**
 * @param {array} files - files on a server
 * @returns {boolean} - whether those files include all the scripts we need to upload
 **/
function hasAllScripts(files) {
  return scripts.every((script) => files.includes(script))
}


/**
 * fetchZombifyableServers
 * Find any servers in the network that haven't gotten the copied files yet.
 * @param {NS} NS
 * @returns {boolean|array} - servers we can work on, or false if none available
 **/
function fetchZombifyableServers(ns) {
  ns.print("Fetching servers from nmap")
  let nmap = getLSItem('nmap')
  if (! nmap ) {
    ns.print('NMAP is not populated, try again later.')
    return false
  }
  let servers = Object.values(nmap)
    .filter(s => s.hasAdminRights &&
                s.name != 'home' &&
                s.maxRam >= hackingScriptSize &&
                !hasAllScripts(ns.ls(s.hostname))
    )
  ns.print(servers.map(s => [s.name, s.hasAdminRights, s.maxRam, s.ramUsed, s.files]))
  // early return, if there are no servers no need to do anything else
  if ( servers.length == 0 ) {
    ns.print("Everything we can zombify has been already.")
    return false
  }
  return servers
}

/**
 * @param {NS} ns
 * @param {string} server - Server host name
 * @returns {boolean} - whether the files successfully copied
 **/
async function zombify(ns, server) {
  var res = ns.scp(scripts, server, "home")
  if ( res ) {
    ns.print(`Copied ${scripts} to ${server}`)
  } else {
    ns.print(`ERROR: Failed in copying ${scripts} to ${server}`)
  }
  return res
}
