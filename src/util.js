// keep track of comp tree's parents
const compStack = [];

const peek = (n=compStack.length) => n && compStack[n-1];

const track = (f, c=peek()) => c && (c.sub(f), c.deps.push(f));

// normalizes shouldUpdate logic
const yes = () => true;

// simplified hyperscript
const h = name => ({name});

module.exports = { compStack, peek, track, yes, h };
