/** 
 * @param {NS} ns 
 **/
export async function main(ns) {
  const portHandle = ns.getPortHandle(ns.pid)
  const job = JSON.parse(ns.args[0])
  ns.print(`Hack job opened, batch ${job.id}`)

  const promise = ns.hack(job.target, { additionalMsec: job.delay })
  portHandle.write('started')
  await promise

  const end = Date.now()
  ns.atExit(() => {
    ns.print(`INFO: Batch ${job.id}: Hack finished at ${end.toString()}`)
  });
}
