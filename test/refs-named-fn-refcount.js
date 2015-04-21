'use strict'

const escontrol = require('../index.js')
const espree = require('espree')
const test = require('tape')

test(function(assert) {
  let cfg = escontrol(espree.parse(`
    function hello() {
    }
  `), {onfunction: onfunction})
  let fn = null

  while (cfg.advance()) ;

  assert.ok(fn)

  assert.equal(fn._references.size, 2)
  let refs = []
  for (let xs of fn._references) {
    refs.push(xs)
  }
  refs = refs.sort(function(lhs, rhs) {
    return lhs === rhs ? 0 : [lhs, rhs].sort()[0] === lhs ? -1 : 1
  })
  assert.equal(refs[0]._name, 'constructor')
  assert.equal(fn.getprop('prototype').value().getprop('constructor'), refs[0])
  assert.equal(refs[1]._name, 'hello')
  assert.equal(cfg.global().getprop('hello'), refs[1])
  assert.end()

  function onfunction(gotFn) {
    fn = gotFn
  }
})
