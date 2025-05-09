
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
  hook0.innerText = "Income\nExper.\nKarma\nShare"

  hook1.innerText =
    `${ns.formatNumber(ns.getTotalScriptIncome()[0], 2)}/s` +
    `\n${ns.formatNumber(ns.getTotalScriptExpGain(), 2)}/s` +
    `\n${ns.formatNumber(ns.heart.break(), 2)}` +
    `\n${ns.formatNumber(ns.getSharePower(), 2)}`
}
