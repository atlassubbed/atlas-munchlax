# atlas-munchlax

Reactive variable and autorun library in 20 lines of code -- inspired by Meteor.

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
    // runs when lastName or firstName changes
    console.log(lastName())
  })
})

```

> If you read the source code, you might notice that this library is (relatively) trivial compared to MobX or Meteor.Tracker. That's because [Relax](https://github.com/atlassubbed/atlas-relax) is doing *all* of the heavy lifting -- we've reduced the task of state management to [*picking a pattern*](#another-pattern) we'd like to use! All of these patterns can be implemented on top of Relax's lego-like primitives. The key here is that the same engine for VDOM/graph diffing and reconcilation can easily power both UI frameworks and state management frameworks.

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

### another pattern!

Munchlax exports `val` and `comp`, which are helpers for using the reactive variable/autorun pattern we saw in frameworks like Meteor and MobX. All it takes is a few lines of code to build your own pattern. Let's implement `observer` from MobX:

```jsx
const obs = render => {
  return (t, f, d) => {
    f.deps = f.deps || [], par = f;
    while(d = f.deps.pop()) f.unsub(d);
    par = void(t = render(t, f));
    return t;
  }
}

// use
// global reactive state variable ("sideways" data)
const isDarkMode = val(false)
// every instance is automatically reactive
const MyComponent = obs(() => {
  return (
    <div>
      We're currently in {isDarkMode() ? "night" : "day"} mode
    </div>
  )
})
```

That was easy, because Relax is doing all of the actual work -- we didn't have to implement any kind of precise update propagation logic because Relax takes care of it all. Instead of importing an entire reactive framework like MobX, we get all the real power of MobX with a single helper function.

Homework: How is this different than `comp`?

<sup>Hint: It's not all that different. The VDOM in Relax isn't a V*DOM*. `comp`s return a list of computations and each `comp` in the list is a child in a `comp` tree (not a DOM!). What children are we returning in `obs`?</sup>