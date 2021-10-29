const valuesToRemove = []
const filesToDownload = [
  'bestHack.js',
  'botnet.js',
  'buyer.js',
  'find.js',
  'groupBy.js',
  'hacknet.js',
  'network.js',
  'rooter.js',
  'whisperer.js',
  'zombifier.js',
]
const baseUrl = 'https://raw.githubusercontent.com/jenheilemann/bitburner/master/src/'

export async function download(ns, filename) {
  const path = baseUrl + filename
  ns.tprint(`Trying to download ${path}`)
  await ns.wget(path + '?ts=' + new Date().getTime(), filename)
}

export async function main(ns) {
  ns.tprint(`Starting initHacking.js`)

  if (ns.getHostname() !== 'home') {
    throw new Exception('Run the script from home')
  }

  for ( let filename of filesToDownload ) {
    ns.scriptKill(filename, 'home')
    ns.rm(filename)
    await ns.sleep(200)
    await download(ns, filename)
  }
  ns.tprint('Killed and deleted old scripts.')
  ns.tprint(`Files downloaded.`)

  valuesToRemove.map((value) => localStorage.removeItem(value))

  ns.tprint(`Starting hacknet.js`)
  ns.run('hacknet.js', 1)
  ns.tprint(`Starting buyer.js`)
  ns.run('buyer.js', 1)
  ns.tprint(`Spawning botnet.js`)
  ns.spawn('botnet.js', 1)
}
