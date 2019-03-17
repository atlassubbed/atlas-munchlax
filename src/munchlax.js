const { diff } = require("atlas-relax");

// Reactive programming library in 20 lines of code on top of Relax

let par;
const track = f => par && (par.sub(f), par.deps.push(f));

// normalizes shouldUpdate logic
const yes = () => true;

// simplified hyperscript
const h = name => ({name});

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
  const temp = h((t, f) => {
    f.comps = [], f.deps = f.deps || [];
    while(t = f.deps.pop()) f.unsub(t); // unsub from prev deps
    par = self = f;
    par = void(cur = render());
    return f.comps; // relax does auto-cleanup
  })
  par ? par.comps.push(temp) : diff(temp);
  // returns getter to allow computed variables
  return () => (track(self), cur);
}

module.exports = { val, comp };
