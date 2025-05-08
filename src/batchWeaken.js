/** 
 * @param {NS} ns 
 **/
export async function main(ns) {
  const portHandle = ns.getPortHandle(ns.pid)
  const job = JSON.parse(ns.args[0])
  ns.print(`Weaken job opened, batch ${job.id}`)

  const promise = ns.weaken(job.target, { additionalMsec: job.delay })
  portHandle.write('started')
  await promise

  const end = Date.now()
  ns.atExit(() => {
    ns.print(`Batch ${job.id}: Weaken finished at ${end.toString()}`)
  });
}
