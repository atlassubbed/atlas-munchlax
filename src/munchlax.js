const { compStack, peek, track, yes, h } = require("./util");
const { diff } = require("atlas-relax");

// Reactive programming library in 20 lines of code on top of Relax

// reactive variable
const val = (cur, shouldUpd=yes) => {
  let pend = cur, f = diff(h(() => cur = pend));
  return (next, tau) => {
    if (next === undefined) track(f);
    else if (shouldUpd(cur, pend = next)) f.diff(tau);
    return cur;
  }
}

// reactive computation
const comp = (render, cur, self) => {
  const parComp = peek(), temp = h((t, f) => {
    f.comps = [], f.deps = f.deps || [];
    while(t = f.deps.pop()) f.unsub(t); // unsub from prev deps
    compStack.push(self = f);
    compStack.pop(cur = render());
    return f.comps; // relax does auto-cleanup
  })
  parComp ? parComp.comps.push(temp) : diff(temp);
  // returns getter to allow computed variables
  return () => (track(self), cur);
}

module.exports = { val, comp };
