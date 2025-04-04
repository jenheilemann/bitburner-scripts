/** 
 * @param {NS} ns 
 **/
export async function main(ns) {
  // ns.ui.openTail()
  const job = JSON.parse(ns.args[0])
  ns.print(`Weaken job opened, batch ${job.id}`)
  let endTime
  if (ns.peek(ns.pid) > 0) {
    ns.print(`Endtime already sent, continuing....`)
    endTime = ns.readPort(ns.pid)
  } else {
    ns.print('Waiting for port write.')
    await ns.nextPortWrite(ns.pid)
    endTime = ns.readPort(ns.pid)
  }
  ns.print(`(${ns.pid}) Port read received, endtime is ${endTime}`)
  let timeNow = performance.now()
  let delay = endTime - job.time - timeNow
  if (delay < 0) {
    ns.tprint(`WARN: Batch ${job.id} ${job.type} was ${-delay}ms too late. (${endTime})\n`);
    delay = 0;
  }
  await ns.weaken(job.target, { additionalMsec: delay })
  const end = Date.now()
  ns.atExit(() => {
    ns.print(`Batch ${job.id}: ${job.type} finished at ${end.toString().slice(-6)}/${Math.round(endTime).toString().slice(-6)}\n`)
  });
}
