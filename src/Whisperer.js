export function Whisperer(ns, loud) {
  this.ns = ns
  this.loud = loud
}

Whisperer.prototype.say = function(msg) {
  whisper(this.ns, this.loud, msg)
}

export function whisper(ns, loud, msg) {
  if (loud == 1) {
    ns.tprint(msg)
  } else {
    ns.print(msg)
  }
}
