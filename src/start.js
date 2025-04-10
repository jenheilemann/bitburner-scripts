export function autocomplete(data, args) {
  data.flags([['branch', 'main']])
  return ['main', 'start-over']
}

export async function main(ns) {
  if (ns.getHostname() !== "home") {
    throw new Exception("Run the script from home");
  }

  let args = ns.flags([['branch', 'main']])

  await ns.wget(
    `https://raw.githubusercontent.com/jenheilemann/bitburner-scripts/${args.branch}/src/startup/initStartup.js?ts=${new Date().getTime()}`,
    "/startup/initStartup.js"
  );
  ns.tprint('Spawing a new startup process.')
  ns.spawn("startup/initStartup.js", {spawnDelay: 500}, '--branch', args.branch);
}
