const { diff, current } = require("atlas-relax");

// Reactive programming library in ~15 lines of code on top of Relax

const yes = () => true;
const track = (f, p=current()) => p && p.comps && (p.sub(f), p.deps.push(f));
const obs = render => function obs(t, f){
  if (f.deps = f.deps || []) while(d = f.deps.pop()) f.unsub(d);
  if (f.comps = f.comps || []) while(d = f.comps.pop()) diff(null, d);
  return render(t, f)
}
const val = (cur, shouldUpd=yes) => {
  let pend = cur, f = diff({name: () => cur = pend});
  return (next, tau) => (next === undefined ? track(f) :
    shouldUpd(cur, pend=next) && f.diff(tau), cur)
}
const comp = (render, cur) => {
  const p = current(), f = diff({name: obs((t, f) => cur = render(f))});
  return p && p.comps && p.comps.push(f), () => (track(f), cur);
}

module.exports = { val, comp, obs };
