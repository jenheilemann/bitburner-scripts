const filesToDownload = [
  '/hacknet/coreUpgrader.js',
  '/hacknet/levelUpgrader.js',
  '/hacknet/ramUpgrader.js',
  '/hacknet/startup.js',
  'bestHack.js',
  'botnet.js',
  'buyer.js',
  'find.js',
  'groupBy.js',
  'helpers.js',
  'network.js',
  'rooter.js',
  'whisperer.js',
  'zombifier.js',

  // replace this crap
  'analyze-hack.js',
  'get-money.script',
  'hack-server.script',
  'zombie-server.script',
]
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner/master/src'

export async function download(ns, filename) {
  const fileUrl = filename.includes("/") ? filename : "/" + filename;
  const path = baseUrl + fileUrl
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}

export async function main(ns) {
  ns.disableLog("sleep")

  for ( let filename of filesToDownload ) {
    ns.scriptKill(filename, 'home')
    ns.rm(filename)
    await ns.sleep(200)
    await download(ns, filename)
  }
  ns.tprint('Killed and deleted old scripts.')
  ns.tprint(`Files downloaded.`)

  ns.tprint(`Starting hacknet/startup.js`)
  ns.run('/hacknet/startup.js', 1)
  ns.tprint(`Starting buyer.js`)
  ns.run('buyer.js', 1)
  ns.tprint(`Spawning botnet.js`)
  ns.run('botnet.js', 1)
}
