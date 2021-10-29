const valuesToRemove = []
const filesToDownload = [
  'BestHack.js',
  'Botnet.js',
  'Buyer.js',
  'Find.js',
  'groupBy.js',
  'HackNet.js',
  'Network.js',
  'Rooter.js',
  'Whisperer.js',
  'Zombifier.js',
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

  ns.tprint(`Starting HackNet.js`)
  ns.run('HackNet.js', 1)
  ns.tprint(`Starting Buyer.js`)
  ns.run('Buyer.js', 1)
  ns.tprint(`Spawning Botnet.js`)
  ns.spawn('Botnet.js', 1)
}
