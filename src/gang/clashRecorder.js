import {
  getNsDataThroughFile as fetch,
  announce,
  getLSItem,
  setLSItem,
  disableLogs
} from 'utils/helpers.js'

/** @param {NS} ns **/
export async function main(ns) {
  disableLogs(ns, ['sleep'])
  const gangInfo = getLSItem('gangMeta')
  if ( !gangInfo || !gangInfo.faction )
    return ns.print('no gang') // can't clash a gang that doesn't exist

  const nextClashTime = getLSItem('clashtime')
  if ( nextClashTime && nextClashTime > Date.now()+1000 ) {
    await ns.sleep(nextClashTime - Date.now() - 1000)
  }

  const currentGangData = JSON.stringify(ns.gang.getOtherGangInformation())
  while( gangDataIsTheSame(ns, currentGangData)) {
    await ns.sleep(10)
  }

  setLSItem('clashtime', Date.now())
  announce(ns, `ClashTime set to ${Date.now()}`)
}

function gangDataIsTheSame(ns, prev) {
  const curr = JSON.stringify(ns.gang.getOtherGangInformation())

  return prev == curr
}
