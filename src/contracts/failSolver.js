/**
 * @param {NS} ns
 **/
export async function main(ns) {
  args = ns.flags([
    ['file', ''],
    ['server', ''],
    ['type', ''],
  ])

  let data = ns.codingcontract.getData(args.file, args.server)
  ns.tprint(`Found ${args.file} (${args.type}) on ${args.server}, data: `)
  ns.tprint(data)

  let attempt = ns.codingcontract.attempt('', args.file, args.server)
}
