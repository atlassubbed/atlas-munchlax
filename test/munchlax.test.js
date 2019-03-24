const { describe, it } = require("mocha")
const { expect } = require("chai")
const { val, comp, obs } = require("../");
const { diff, Frame } = require("atlas-relax");

const asap = Promise.resolve().then.bind(Promise.resolve())
const h = name => ({name});

// val shouldn't track non-comps and non-observers
//   test render and rendered
// comp shouldn't work in rendered
// obs should work in rendered

describe("reactivity", function(){
  describe("reactive variables", function(){
    it("should get variables with no initial value", function(){
      const first = val();
      expect(first()).to.be.undefined;
    })
    it("should get variables with an initial value", function(){
      const first = val("atlas");
      expect(first()).to.equal("atlas");
    })
    it("should set variables to a new value", function(){
      const first = val("atlas");
      expect(first("jai")).to.equal("jai");
    })
    it("should get variables' new value", function(){
      const first = val("atlas");
      first("jai");
      expect(first()).to.equal("jai")
    })
  })
  describe("reactive computations", function(){
    it("should get computations with no return value", function(){
      const first = comp(() => {})
      expect(first()).to.be.undefined;
    })
    it("should get computations with a return value", function(){
      const first = comp(() => "atlas")
      expect(first()).to.equal("atlas");
    })
    it("should get computations that depend on a reactive variable", function(){
      const first = val("atlas")
      const firstInitial = comp(() => first()[0].toUpperCase());
      expect(firstInitial()).to.equal("A");
    })
    it("should rerun computations when an underlying reactive variable updates", function(){
      const first = val("atlas")
      const firstInitial = comp(() => first()[0].toUpperCase());
      first("jai");
      expect(firstInitial()).to.equal("J")
    })
    it("should not rerun computations when an underlying reactive variable does not change", function(){
      const first = val("atlas", (cur, next) => cur !== next)
      let called = 0;
      const firstInitial = comp(() => (called++, first()[0].toUpperCase()));
      expect(called).to.equal(1)
      first("atlas");
      expect(called).to.equal(1);
    })
    it("should get computations that depend on a derived reactive computation", function(){
      const first = val("atlas")
      const last = val("subbed");
      const full = comp(() => `${first()} ${last()}`)
      const initials = comp(() => full().split(" ").map(n => n[0].toUpperCase()).join(""))
      expect(initials()).to.equal("AS");
    })
    it("should rerun computations when an underlying reactive computation updates", function(){
      const first = val("atlas")
      const last = val("subbed");
      const full = comp(() => `${first()} ${last()}`)
      const initials = comp(() => full().split(" ").map(n => n[0].toUpperCase()).join(""))
      first("jai")
      expect(initials()).to.equal("JS");
    })
    it("should dynamically depend on the most recently accessed reactive variables", function(){
      const first = val();
      const last = val("subbed");
      let called = 0;
      const nick = comp(() => (called++, first() || last()))
      expect(called).to.equal(1)
      expect(nick()).to.equal("subbed");
      first("atlas")
      expect(called).to.equal(2)
      expect(nick()).to.equal("atlas");
      last("munchies")
      expect(called).to.equal(2)
      expect(nick()).to.equal("atlas");
      first(null);
      expect(called).to.equal(3)
      expect(nick()).to.equal("munchies");
    })
    it("should rerun inner computations when outer computations update", function(){
      const first = val("atlas");
      const last = val("subbed");
      let calledOuter = 0, calledInner = 0;
      comp(() => {
        first(), calledOuter++;
        comp(() => {
          last(), calledInner++;
        })
      })
      first("jai");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(2)
    })
    it("should not rerun outer computations when inner computations update", function(){
      const first = val("atlas");
      const last = val("subbed");
      let calledOuter = 0, calledInner = 0;
      comp(() => {
        first(), calledOuter++;
        comp(() => {
          last(), calledInner++;
        })
      })
      last("munchies");
      expect(calledOuter).to.equal(1);
      expect(calledInner).to.equal(2)
    })
    it("should run computations in stack order", function(){
      const called = [];
      comp(() => {
        called.push(1);
        comp(() => called.push(2))
        comp(() => called.push(3))
        comp(() => called.push(4))
      })
      expect(called).to.eql([1,4,3,2])
    })
    it("should re-run computations in stack order", function(){
      const first = val("atlas")
      const called = [];
      comp(() => {
        first(), called.push(1);
        comp(() => (called.push(2)))
        comp(() => called.push(3))
        comp(() => (called.push(4)))
      })
      first("jai")
      expect(called).to.eql([1,4,3,2,1,4,3,2])
    })
    it("should update nested computations atomically", function(){
      const first = val("atlas");
      const called = [];
      comp(() => {
        first(), called.push(1);
        comp(() => {
          first(), called.push(2);
          comp(() => {
            first(), called.push(3);
          })
        })
      })
      first("jai")
      expect(called).to.eql([1,2,3,1,2,3])
    })
    it("should update derived computations atomically", function(){
      const first = val("atlas");
      const last = val("subbed");
      const full = comp(() => `${first()} ${last()}`)
      const initials = comp(() => full().split(" ").map(n => n[0]).join(""))
      let called = 0;
      comp(() => {
        first(), full(), initials(), called++;
      })
      first("jai")
      expect(called).to.equal(2)
    })
    it("should dynamically depend on only the currently used nested computations", function(){
      const precipitation = val("rain");
      const isSunny = val(false);
      let calledInner = 0, calledOuter = 0;
      comp(() => {
        calledOuter++;
        isSunny() || comp(() => {
          calledInner++;
          precipitation()
        })
      })
      expect(calledOuter).to.equal(1)
      expect(calledInner).to.equal(1)
      isSunny(true);
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
      precipitation("hail");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
    })
    it("should dynamically depend on only the currently used post-order nested computations", function(){
      const precipitation = val("rain");
      const isSunny = val(false);
      let calledInner = 0, calledOuter = 0;
      comp(f => {
        calledOuter++;
        f.rendered = () => {
          isSunny() || comp(() => {
            calledInner++;
            precipitation()
          })
        }
      })
      expect(calledOuter).to.equal(1)
      expect(calledInner).to.equal(1)
      isSunny(true);
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
      precipitation("hail");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
    })
    it("should not batch reactive variable updates by default", function(){
      const first = val("atlas");
      const last = val("subbed");
      let called = 0;
      const full = comp(() => (called++, `${first()} ${last()}`))
      expect(called).to.equal(1);
      first("jai")
      expect(called).to.equal(2);
      expect(full()).to.equal("jai subbed")
      last("munchies")
      expect(called).to.equal(3);
      expect(full()).to.equal("jai munchies")
    })
    it("should batch reactive variable updates if batch function is provided", function(done){
      const first = val("atlas");
      const last = val("subbed");
      let called = 0;
      const full = comp(() => (called++, `${first()} ${last()}`))
      expect(called).to.equal(1);
      first("jai", asap)
      expect(called).to.equal(1);
      expect(full()).to.equal("atlas subbed")
      last("munchies", asap)
      expect(called).to.equal(1);
      expect(full()).to.equal("atlas subbed");
      asap().then(() => {
        expect(called).to.equal(2);
        expect(full()).to.equal("jai munchies");
        done();
      })
    })
  })
  describe("reactive (observed) render functions", function(){
    // could add support for this some other time, keep it simple for now.
    // it("should use a custom name if supplied with an arrow function", function(){
    //   const MyApp = () => {};
    //   const decoratedRender = obs(MyApp, "CustomName");
    //   expect(decoratedRender.name).to.equal("CustomName");
    // })
    // it("should use a custom name if supplied with a function", function(){
    //   function MyApp(){};
    //   const decoratedRender = obs(MyApp, "CustomName");
    //   expect(decoratedRender.name).to.equal("CustomName");
    // })
    // it("should inherit the name of the passed arrow function", function(){
    //   const MyApp = () => {};
    //   const decoratedRender = obs(MyApp);
    //   expect(decoratedRender.name).to.equal("MyApp");
    // })
    // it("should inherit the name of the passed function", function(){
    //   function MyApp(){};
    //   const decoratedRender = obs(MyApp);
    //   expect(decoratedRender.name).to.equal("MyApp");
    // })
    it("should use the name 'obs' if the passed an arrow function", function(){
      const makeAnonRender = () => () => {};
      const decoratedRender = obs(makeAnonRender());
      expect(decoratedRender.name).to.equal("obs");
    })
    it("should use the name 'obs' if passed a regular function", function(){
      const makeAnonRender = () => function(){};
      const decoratedRender = obs(makeAnonRender());
      expect(decoratedRender.name).to.equal("obs");
    })
    it("should run render with no return value", function(){
      let called = 0;
      diff(h(obs(() => {
        called++;
      })))
      expect(called).to.equal(1);
    })
    it("should run render that return children", function(){
      let called = 0, calledChild = 0;
      diff(h(obs(() => {
        called++;
        return h(() => calledChild++)
      })))
      expect(called).to.equal(1);
      expect(calledChild).to.equal(1);
    })
    it("should run render that depends on a reactive variable", function(){
      const first = val("atlas")
      let called = 0, seenValue;
      diff(h(obs(() => {
        called++;
        seenValue = first();
      })))
      expect(called).to.equal(1);
      expect(seenValue).to.equal("atlas");
    })
    it("should rerender when an underlying reactive variable updates", function(){
      const first = val("atlas")
      let called = 0, seenValue;
      diff(h(obs(() => {
        called++;
        seenValue = first();
      })))
      first("jai")
      expect(called).to.equal(2);
      expect(seenValue).to.equal("jai")
    })
    it("should not rerender when an underlying reactive variable does not change", function(){
      const first = val("atlas", (cur, next) => cur !== next)
      let called = 0, seenValue;
      diff(h(obs(() => {
        called++;
        seenValue = first();
      })))
      first("atlas")
      expect(called).to.equal(1);
      expect(seenValue).to.equal("atlas")
    })
    it("should run render that depends on a derived reactive computation", function(){
      const first = val("atlas")
      const last = val("subbed");
      const full = comp(() => `${first()} ${last()}`)
      let called = 0, seenValue;
      diff(h(obs(() => {
        called++;
        seenValue = full();
      })))
      expect(called).to.equal(1);
      expect(seenValue).to.equal("atlas subbed");
    })
    it("should rerender when an underlying reactive computation updates", function(){
      const first = val("atlas")
      const last = val("subbed");
      const full = comp(() => `${first()} ${last()}`)
      let called = 0, seenValue;
      diff(h(obs(() => {
        called++;
        seenValue = full();
      })))
      first("jai")
      expect(called).to.equal(2);
      expect(seenValue).to.equal("jai subbed");
    })
    it("should dynamically depend on the most recently accessed reactive variables", function(){
      const first = val();
      const last = val("subbed");
      let called = 0, seenValue;
      diff(h(obs(() => {
        called++;
        seenValue = first() || last();
      })))
      expect(called).to.equal(1)
      expect(seenValue).to.equal("subbed");
      first("atlas")
      expect(called).to.equal(2)
      expect(seenValue).to.equal("atlas");
      last("munchies")
      expect(called).to.equal(2)
      expect(seenValue).to.equal("atlas");
      first(null);
      expect(called).to.equal(3)
      expect(seenValue).to.equal("munchies");
    })
    it("should rerender observed children when observed parent updates", function(){
      const first = val("atlas");
      const last = val("subbed");
      let calledOuter = 0, calledInner = 0;
      diff(h(obs(() => {
        first(), calledOuter++;
        return h(obs(() => {
          last(), calledInner++;
        }))
      })))
      first("jai");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(2)
    })
    it("should re-run nested computations when observed parent updates", function(){
      const first = val("atlas");
      const last = val("subbed");
      let calledOuter = 0, calledInner = 0;
      diff(h(obs(() => {
        first(), calledOuter++;
        comp(() => {
          last(), calledInner++;
        })
      })))
      first("jai");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(2)
    })
    it("should not rerender observed parents when observed child updates", function(){
      const first = val("atlas");
      const last = val("subbed");
      let calledOuter = 0, calledInner = 0;
      diff(h(obs(() => {
        first(), calledOuter++;
        return h(obs(() => {
          last(), calledInner++;
        }))
      })))
      last("munchies");
      expect(calledOuter).to.equal(1);
      expect(calledInner).to.equal(2)
    })
    it("should not rerender observed parents when nested computation updates", function(){
      const first = val("atlas");
      const last = val("subbed");
      let calledOuter = 0, calledInner = 0;
      diff(h(obs(() => {
        first(), calledOuter++;
        comp(() => {
          last(), calledInner++;
        })
      })))
      last("munchies");
      expect(calledOuter).to.equal(1);
      expect(calledInner).to.equal(2)
    })
    it("should run renders in top-bottom order", function(){
      const called = [];
      diff(h(obs(() => {
        called.push(1);
        return [
          h(obs(() => called.push(2))),
          h(obs(() => called.push(3))),
          h(obs(() => called.push(4)))
        ]
      })))
      expect(called).to.eql([1,2,3,4])
    })
    it("should run computations in stack order", function(){
      const called = [];
      diff(h(obs(() => {
        called.push(1);
        comp(() => called.push(2))
        comp(() => called.push(3))
        comp(() => called.push(4))
      })))
      expect(called).to.eql([1,4,3,2])
    })
    it("should re-run renders in top-bottom order", function(){
      const first = val("atlas")
      const called = [];
      diff(h(obs(() => {
        first(), called.push(1);
        return [
          h(obs(() => called.push(2))),
          h(obs(() => called.push(3))),
          h(obs(() => called.push(4)))
        ]
      })))
      first("jai")
      expect(called).to.eql([1,2,3,4,1,2,3,4])
    })
    it("should re-run computations in stack order", function(){
      const first = val("atlas")
      const called = [];
      diff(h(obs(() => {
        first(), called.push(1);
        comp(() => called.push(2))
        comp(() => called.push(3))
        comp(() => called.push(4))
      })))
      first("jai")
      expect(called).to.eql([1,4,3,2,1,4,3,2])
    })
    it("should update observed progeny atomically", function(){
      const first = val("atlas");
      const called = [];
      diff(h(obs(() => {
        first(), called.push(1);
        return h(obs(() => {
          first(), called.push(2);
          return h(obs(() => {
            first(), called.push(3);
          }))
        }))
      })))
      first("jai")
      expect(called).to.eql([1,2,3,1,2,3])
    })
    it("should update nested computations atomically", function(){
      const first = val("atlas");
      const called = [];
      diff(h(obs(() => {
        first(), called.push(1);
        return comp(() => {
          first(), called.push(2);
          return comp(() => {
            first(), called.push(3);
          })
        })
      })))
      first("jai")
      expect(called).to.eql([1,2,3,1,2,3])
    })
    it("should update observed derived computations atomically", function(){
      const first = val("atlas");
      const last = val("subbed");
      const full = comp(() => `${first()} ${last()}`)
      const initials = comp(() => full().split(" ").map(n => n[0]).join(""))
      let called = 0;
      diff(h(obs(() => {
        first(), full(), initials(), called++;
      })));
      first("jai")
      expect(called).to.equal(2)
    })
    it("should dynamically depend on only the currently used observed progeny", function(){
      const precipitation = val("rain");
      const isSunny = val(false);
      let calledInner = 0, calledOuter = 0;
      diff(h(obs(() => {
        calledOuter++;
        return isSunny() || h(obs(() => {
          calledInner++;
          precipitation()
        }))
      })));
      expect(calledOuter).to.equal(1)
      expect(calledInner).to.equal(1)
      isSunny(true);
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
      precipitation("hail");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
    })
    it("should dynamically depend on only the currently used reactive computations", function(){
      const precipitation = val("rain");
      const isSunny = val(false);
      let calledInner = 0, calledOuter = 0;
      diff(h(obs(() => {
        calledOuter++;
        isSunny() || comp(() => {
          calledInner++;
          precipitation()
        })
      })));
      expect(calledOuter).to.equal(1)
      expect(calledInner).to.equal(1)
      isSunny(true);
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
      precipitation("hail");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
    })
    it("should dynamically depend on only the currently used post-order reactive computations", function(){
      const precipitation = val("rain");
      const isSunny = val(false);
      let calledInner = 0, calledOuter = 0;
      diff(h(obs((t, f) => {
        calledOuter++;
        f.rendered = () => {
          isSunny() || comp(() => {
            calledInner++;
            precipitation()
          })
        }
      })));
      expect(calledOuter).to.equal(1)
      expect(calledInner).to.equal(1)
      isSunny(true);
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
      precipitation("hail");
      expect(calledOuter).to.equal(2);
      expect(calledInner).to.equal(1);
    })
    it("should not batch renders due to reactive variable updates by default", function(){
      const first = val("atlas");
      const last = val("subbed");
      let called = 0, seenVal;
      diff(h(obs(() => {
        called++;
        seenVal = `${first()} ${last()}`;
      })))
      expect(called).to.equal(1);
      first("jai")
      expect(called).to.equal(2);
      expect(seenVal).to.equal("jai subbed")
      last("munchies")
      expect(called).to.equal(3);
      expect(seenVal).to.equal("jai munchies")
    })
    it("should batch renders when reactive variables update if batch function is provided", function(done){
      const first = val("atlas");
      const last = val("subbed");
      let called = 0, seenVal;
      diff(h(obs(() => {
        called++;
        seenVal = `${first()} ${last()}`
      })))
      expect(called).to.equal(1);
      first("jai", asap)
      expect(called).to.equal(1);
      expect(seenVal).to.equal("atlas subbed")
      last("munchies", asap)
      expect(called).to.equal(1);
      expect(seenVal).to.equal("atlas subbed");
      asap().then(() => {
        expect(called).to.equal(2);
        expect(seenVal).to.equal("jai munchies");
        done();
      })
    })
  })
})
