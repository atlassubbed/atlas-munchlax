# atlas-munchlax

Reactive variable and autorun library in 15 lines of code -- inspired by Meteor.

[![Travis](https://img.shields.io/travis/atlassubbed/atlas-munchlax.svg)](https://travis-ci.org/atlassubbed/atlas-munchlax)

[<img alt="Munchlax being awesome" align="right" width="200" src="https://user-images.githubusercontent.com/38592371/54497007-f192c700-48cb-11e9-99c9-f040209c362d.png">](https://pokemondb.net/pokedex/munchlax?q=use-atlas-relax)

Munchlax gives you reactive variables, computed variables, observers, and autoruns:

```jsx

const { val, comp, obs } = require("atlas-munchlax");

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

// reactively "observe" render functions (like in Mobx)
// shares all the same properties as reactive computations
//   * can nest comps and children can be observed, too
//   * scoped reactivity, no redundant renders, etc.
const App = obs(() => {
  // automatically rerenders when firstName is set
  return (
    <div>
      My name is {firstName()}
    </div>
  )
})
```

> If you read the source code, you might notice that this library is (relatively) trivial compared to MobX or Meteor.Tracker. That's because [Relax](https://github.com/atlassubbed/atlas-relax) is doing *all* of the heavy lifting -- we've reduced the task of state management to [*picking a pattern*](#obs-vs-comp) we'd like to use! All of these patterns can be implemented on top of Relax's lego-like primitives. The key here is that the same engine for VDOM/graph diffing and reconcilation can easily power both UI frameworks and state management frameworks.

### concepts

Everything in Munchlax is either a **reactive variable** or a **reactive computation** (an "observed" function). If a reactive computation returns a value, then that value is a "derived" value, and can be depended on by other reactive computations as if it were a reactive variable. Reactive computations are just functions which track ("observe") the values they depend on. If an underlying value changes, the computation is rerun efficiently and atomically.

### getting/setting reactive variables in other frameworks

  1. **Meteor**: Meteor has a very explicit syntax for getting/setting reactive variables. First, you create the variable with `const name = new ReactiveVar("atlas")`, then you can get it with `name.get()` and set it with `name.set("jai")`. This is a bit verbose.
  2. **MobX**: MobX is on the other end of the spectrum. You initialize instance values with `@observable name = "atlas"`, then you can get them by calling `this.name` and set them with `this.name = "jai"`. This is too implicit and obfuscates reactivity intent -- there are too many gotchyas for beginners.
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

### `obs` vs. `comp`

A `comp` is like MobX's `autorun` and `@computed` APIs in one function. It is similar to Meteor's `Tracker.autorun` as well.

`obs` is basically the same as `comp`, except it lets you "wrap" render functions and automatically turn them into reactive autoruns. The `obs` implementation is 3 lines of code. It's so short because it's an API wrapper for something you can already do with Relax. 

Relax is a state management library, but it is not opinionated. It provides the necessary primitives for you to form your own opinion. *Munchlax* is merely an opinion, and it's for the people who love Meteor and MobX. If you aren't one of those people, don't worry -- Relax makes it easy for you to use a different opinion. Hopefully you will feel at home with `val`, `comp`, and `obs`:

```jsx
import { val, obs } from "atlas-munchlax";
import { t } from "atlas-relax-jsx-pragma";
/**@jsx t */

// global "sideways" data
const isDarkMode = val(false)

// every instance is automatically reactive
const MyDashboard = obs(() => {
  const toggle = () => isDarkMode(!isDarkMode());
  return [
    <p>
      We're currently in {isDarkMode() ? "night" : "day"} mode
    </p>,
    <button onClick={toggle}>
      Toggle night mode
    </button>
  ]
})
```

Instead of importing an entire reactive framework like MobX, we get most of the power of MobX with a 3 line helper function.

### `obs` has a few caveats, but `comp` solves them all:
  
  1. `obs` can't wrap classes (or constructors) yet: `obs(class MyApp extends Frame {...})`. I'll implement this if people start using this, or feel free to open a PR. The basic idea is to rewrite the render prototype method for the class with a wrapped method.

  2. `obs` hasn't been defined to take non-render functions. This is by design. `obs` is specifically designed to decorate render functions (i.e. functional components).

  3. `obs` returns a functional component. Just as you are never supposed to instantiate components directly (`const dashboard = new MyDashboardComponent()`), you are also not supposed to manually call the return function from `obs`, since it's a decorated component. Again, this is by design.

  If you find yourself needing these things, then you should use `comp`, since it was designed for these use-cases.

#### credits

[GhostyDoesStuff](https://aminoapps.com/c/pokemon/page/user/ghostydoesstuff-tm/jlhp_fgmM8N1gMK1GebwPGp153oRKr) made the "Munchlax in Sunglasses" image.
