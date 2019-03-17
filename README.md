# atlas-munchlax

Reactive variable and autorun library inspired by Meteor.

[![Travis](https://img.shields.io/travis/atlassubbed/atlas-munchlax.svg)](https://travis-ci.org/atlassubbed/atlas-munchlax)

---

Munchlax gives you reactive variables, computed variables and autoruns:

```javascript

const { val, comp } = require("atlas-munchlax");

// reactive variables with initial values
const firstName = val("Atlas");
const lastName = val("Subbed");

// reactive variable with no initial value
const nickName = val();

// setting values (send a new value)
firstName("jai")

// getting values (ask for current value)
const currentValue = firstName()

// derived/computed reactive variable
const initials = comp(() => firstName()[0]+lastName()[0]);

// reactive "autorun" that depends on `nickName` and `initials`
comp(() => {
  // won't depend on initials anymore if nickName becomes truthy
  console.log(nickName() || initials());
})

// scoped reactivity via nested computations
comp(() => {
  // runs when firstName changes
  console.log(firstName());
  comp(() => {
    // runs when lastName changes
    console.log(lastName())
  })
})

```

### concepts

Everything in Munchlax is either a **reactive variable** or a **reactive computation** (an "observed" function). If a reactive computation returns a value, then that value is a "derived" value, and can be depended on by other reactive computations as if it were a reactive variable. Reactive computations are just functions which track (i.e. "observe") the values they depend on. If an underlying value changes, the computation is rerun efficiently and atomically.

### getting/setting reactive variables in other frameworks

  1. **Meteor**: Meteor has a very explicit syntax for getting/setting reactive variables. First, you create the variable with `const name = new ReactiveVar("atlas")`, then you can get it with `name.get()` and set it with `name.set("jai")`. This is a bit verbose.
  2. **MobX**: MobX is on the other end of the spectrum. You initialize instance values with `@observable name = "atlas"`, then you can get them by calling `this.name` and set them with `this.name = "jai"`. This is too implicit and obfuscates reactivity intent.
  3. **S**: S introduced an API that is half-way between the above two. To create values, you use `const name = S.data("atlas")`, to get them you do `name()` and to set them, you send the variable a new value with `name("jai")`.

Munchlax keeps things explicit and terse by using S's syntax.

### just relax!

Munchlax is just a taste of what you can build with [Relax](https://github.com/atlassubbed/atlas-relax) in a few lines of code. The idea behind Relax is that the same code for a view framework can power a full-blown state management framework, since they use the same structures and algorithms under-the-hood. 

Don't think of Munchlax as a state management library. *Relax* is the state management library here. Munchlax is just a set of tiny helper functions for Relax that expose a terse API you might be more familiar with.

### advanced

With Munchlax, you can batch updates (powered by Relax) and you can provide equality functions to reactive values that tell them when not to change. The unit tests will show you how to use these features.

### install

```
npm install --save atlas-relax # peer dependency
npm install --save atlas-munchlax
```

### todo

Basically `observer` from MobX, but powered by the view framework itself, instead of an entire additional reactive codebase:

```javascript
const obs = render => {
  return (t, f, d) => {
    f.deps = f.deps || [], compStack.push(f);
    while(d = f.deps.pop()) f.unsub(d);
    compStack.pop(t = render(t, f));
    return t;
  }
}
```

Homework: How is this different than `comp`?

<sup>Hint: It's not all that different. The VDOM in Relax isn't a V*DOM*. `comp`s return `f.comps` and each `comp` is a child in a `comp` tree (not a DOM!). What children are we returning in `obs`?</sup>