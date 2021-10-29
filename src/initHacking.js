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

export async function download(ns, filesToDownload) {
  filesToDownload.forEach((filename) => {
    const path = baseUrl + filename
    await ns.sleep(100)
    ns.tprint(`Trying to download ${path}`)
    await ns.wget(path + '?ts=' + new Date().getTime(), filename)
  }, ns)

  ns.tprint(`Files downloaded.`)
}

export async function main(ns) {
  ns.tprint(`Starting initHacking.js`)

  if (ns.getHostname() !== 'home') {
    throw new Exception('Run the script from home')
  }

  filesToDownload.forEach((filename) => {
    await ns.scriptKill(filename, 'home')
    await ns.rm(filename)
  }, ns)
  ns.tprint('Killed and deleted old scripts.')
  await download(ns, filesToDownload)

  valuesToRemove.map((value) => localStorage.removeItem(value))

  ns.tprint(`Starting HackNet.js`)
  ns.run('HackNet.js', 1)
  ns.tprint(`Starting Buyer.js`)
  ns.run('Buyer.js', 1)
  ns.tprint(`Spawning Botnet.js`)
  ns.spawn('Botnet.js', 1)
}
