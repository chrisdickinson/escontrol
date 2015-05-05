'use strict'

const escontrol = require('../index.js')
const espree = require('espree')
const test = require('tape')

const parseOpts = {
  ecmaFeatures: {
    blockBindings: true,
    templateStrings: true
  }
}

test('onvalue reports expected builtin values', function(assert) {
  const values = new Set()
  const cfg = escontrol(espree.parse(`
    ;
  `, parseOpts), {onvalue: onvalue})

  while (cfg.advance()) {
    ;
  }

  const seenBuiltins = new Set()
  for (const obj of iterateObjects(cfg.builtins(), seenBuiltins)) {
    seenBuiltins.add(obj)
  }
  for (const obj of iterateObjects(cfg.global(), seenBuiltins)) {
    seenBuiltins.add(obj)
  }

  assert.equal(seenBuiltins.size, values.size)
  assert.end()

  function onvalue(value) {
    values.add(value)
  }
})

test('onvalue reports user-created values', function(assert) {
  const values = new Set()
  const cfg = escontrol(espree.parse(`
    var x = 3;
  `, parseOpts), {onvalue: onvalue})

  while (cfg.advance()) {
    ;
  }

  const seenBuiltins = new Set()
  for (const obj of iterateObjects(cfg.builtins(), seenBuiltins)) {
    seenBuiltins.add(obj)
  }
  for (const obj of iterateObjects(cfg.global(), seenBuiltins)) {
    seenBuiltins.add(obj)
  }

  // for a brief, sparkling moment in time, "x", above, is undefined
  seenBuiltins.add(cfg.makeUndefined())
  assert.equal(seenBuiltins.size, values.size)
  assert.end()

  function onvalue(value) {
    values.add(value)
  }
})

test('onvalue reports user-created values that are not reachable', function(assert) {
  const values = new Set()
  const cfg = escontrol(espree.parse(`
    "hello".slice();
  `, parseOpts), {onvalue: onvalue})

  while (cfg.advance()) {
    ;
  }

  const seenBuiltins = new Set()
  for (const obj of iterateObjects(cfg.builtins(), seenBuiltins)) {
    seenBuiltins.add(obj)
  }
  for (const obj of iterateObjects(cfg.global(), seenBuiltins)) {
    seenBuiltins.add(obj)
  }

  // why three? two string values – "hello" and the sliced "hello",
  // and one String object.
  assert.equal(seenBuiltins.size + 3, values.size)

  for(const xs of values) {
    if (!seenBuiltins.has(xs))
      console.log(xs)
  }
  assert.end()

  function onvalue(value) {
    values.add(value)
  }
})

function* iterateObjects(obj, seenValues) {
  yield obj
  for (const name of obj.names()) {
    if (seenValues.has(name.value())) {
      continue
    }
    yield *iterateObjects(name.value(), seenValues)
  }
}
