const { diff } = require("atlas-relax");

// Reactive programming library in ~20 lines (minus comments/ws) of code on top of Relax

let par;

const yes = () => true;

const track = f => par && (par.sub(f), par.deps.push(f));

const untrack = (f, d, deps=f.deps=f.deps||[]) => {
  while(d = deps.pop()) f.unsub(d)
}

// reactive variable
const val = (cur, shouldUpd=yes) => {
  let pend = cur, f = diff({name: () => cur = pend});
  return (next, tau) => (
    next === undefined ? track(f) : shouldUpd(cur, pend=next) && f.diff(tau), cur
  )
}

// reactive computation
const comp = (render, cur, self) => {
  const temp = {name: (t, f) => {
    f.comps = [], untrack(par = self = f);
    // relax auto-cleans up old comps
    return par = void(cur = render()), f.comps;
  }}
  // return a getter to enable reactive computed variables
  return par ? par.comps.push(temp) : diff(temp), () => (track(self), cur);
}

const obs = (render, value=render.name) => {
  const obs = (t, f, d) => {
    f.comps = f.comps || [], untrack(par = f)
    while(d = f.comps.pop()) diff(null, d);
    t = render(t, f), d = f.comps.length;
    while(d--) f.comps[d] = diff(f.comps[d]);
    return par = null, t;
  }
  return value && Object.defineProperty(obs, "name", {value}), obs;
}

module.exports = { val, comp, obs };
