// import { getNsDataThroughFile as fetch } from './helpers.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  const doc = eval('document')
  const hook0 = doc.getElementById('overview-extra-hook-0')
  const hook1 = doc.getElementById('overview-extra-hook-1')
  if ( !hook0 || !hook1 ) {
    return
  }
  // hook0.innerText = "Hashes\nStock\nScrInc\nScrExp"
  hook0.innerText = "Income\nExper.\nKarma"

  // const hashes = await getNsDataThroughFile(ns, '[ns.hacknet.numHashes(), ns.hacknet.hashCapacity()]', '/Temp/hash-stats.txt')
  // const stkSymbols = await getNsDataThroughFile(ns, `ns.stock.getSymbols()`, '/Temp/stock-symbols.txt');
  // const stkPortfolio = await getNsDataThroughFile(ns, JSON.stringify(stkSymbols) +
  //   `.map(sym => ({ sym, pos: ns.stock.getPosition(sym), ask: ns.stock.getAskPrice(sym), bid: ns.stock.getBidPrice(sym) }))` +
  //   `.reduce((total, stk) => total + stk.pos[0] * stk.bid + stk.pos[2] * (stk.ask * 2 - stk.bid), 0)`,
  //   '/Temp/stock-portfolio-value.txt')
  // hook1.innerText =
  //   `${formatNumberShort(hashes[0], 3, 0)}/${ns.nFormat(hashes[1], 3, 0)}` +
  //   `\n${formatMoney(stkPortfolio)}` +
  //   `\n${ns.nFormat(ns.getScriptIncome()[0], '$0,0')}/s` +
  //   `\n${ns.nFormat(ns.getScriptExpGain(), 3, 2)}/s`
  hook1.innerText =
    `${ns.nFormat(ns.getScriptIncome()[0], "$0.0a")}/s` +
    `\n${ns.nFormat(ns.getScriptExpGain(), "0.0a")}/s` +
    `\n${ns.nFormat(ns.heart.break(), "0.0a")}`
}
