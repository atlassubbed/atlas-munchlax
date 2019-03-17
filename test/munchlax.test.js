const { describe, it } = require("mocha")
const { expect } = require("chai")
const { val, comp } = require("../");

const asap = Promise.resolve().then.bind(Promise.resolve())

describe("reactive computations", function(){
  describe("reactive variable", function(){
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
  describe("reactive computation", function(){
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
    it("should run computations in top-bottom order", function(){
      const called = [];
      comp(() => {
        called.push(1);
        comp(() => called.push(2))
        comp(() => called.push(3))
        comp(() => called.push(4))
      })
      expect(called).to.eql([1,2,3,4])
    })
    it("should re-run computations in top-bottom order", function(){
      const first = val("atlas")
      const called = [];
      comp(() => {
        first(), called.push(1);
        comp(() => (called.push(2)))
        comp(() => called.push(3))
        comp(() => (called.push(4)))
      })
      first("jai")
      expect(called).to.eql([1,2,3,4,1,2,3,4])
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
})