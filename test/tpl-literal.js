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

test('no interpolation', function(assert) {
  let cfg = escontrol(espree.parse(`
    xs = \`hello world\`;
  `, parseOpts))

  while (cfg.advance()) {
    // nop
  }

  const edges = cfg.edges()
  assert.equal(edges.length, 7)
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL_TEMPLATE',
    'LOAD_LITERAL_TEMPLATE', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'EXIT'
  ]
  let idx = 0
  for (var edge of edges) {
    assert.equal(edge.from.opname(), items[idx])
    assert.equal(edge.to.opname(), items[idx + 1])
    idx += 2
  }
  assert.equal(idx, items.length)

  assert.ok(cfg.global().getprop('xs').value().isString())
  assert.end()
})

test('interpolation of known', function(assert) {
  let cfg = escontrol(espree.parse(`
    var value = 3;
    var xs = \`hello \${value}\`;
  `, parseOpts))

  while (cfg.advance()) {
    // nop
  }

  const edges = cfg.edges()
  assert.equal(edges.length, 10)
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'STORE_VALUE',
    'STORE_VALUE', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'LOAD_LITERAL_TEMPLATE',
    'LOAD_LITERAL_TEMPLATE', 'STORE_VALUE',
    'STORE_VALUE', 'EXIT'
  ]

  let idx = 0
  for (var edge of edges) {
    assert.equal(edge.from.opname(), items[idx])
    assert.equal(edge.to.opname(), items[idx + 1])
    idx += 2
  }
  assert.equal(idx, items.length)

  assert.ok(cfg.global().getprop('xs').value().isString())
  assert.end()
})

test('interpolation of unknown', function(assert) {
  let cfg = escontrol(espree.parse(`
    var xs = \`hello \${value}\`;
  `, parseOpts))

  while (cfg.advance()) {
    // nop
  }

  const edges = cfg.edges()
  assert.equal(edges.length, 8)
  let idx = 0
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'EXC',
    'LOAD_VALUE', 'LOAD_LITERAL_TEMPLATE',
    'LOAD_LITERAL_TEMPLATE', 'STORE_VALUE',
    'STORE_VALUE', 'EXIT',
  ]

  for (var edge of edges) {
    assert.equal(edge.from.opname(), items[idx])
    assert.equal(edge.to.opname(), items[idx + 1])
    idx += 2
  }
  assert.equal(idx, items.length)

  assert.ok(cfg.global().getprop('xs').value().isString())
  assert.end()
})

test('interpolation of expr', function(assert) {
  let cfg = escontrol(espree.parse(`
    var a = 3;
    var b = 2;
    var xs = \`hello \${a + b}\`;
  `, parseOpts))

  while (cfg.advance()) {
    // nop
  }

  const edges = cfg.edges()
  assert.equal(edges.length, 15)
  let idx = 0
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'STORE_VALUE',
    'STORE_VALUE', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'STORE_VALUE',
    'STORE_VALUE', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'LOAD_VALUE',
    'LOAD_VALUE', 'ADD',
    'ADD', 'LOAD_LITERAL_TEMPLATE',
    'LOAD_LITERAL_TEMPLATE', 'STORE_VALUE',
    'STORE_VALUE', 'EXIT'
  ]

  for (var edge of edges) {
    assert.equal(edge.from.opname(), items[idx])
    assert.equal(edge.to.opname(), items[idx + 1])
    idx += 2
  }
  assert.equal(idx, items.length)

  assert.ok(cfg.global().getprop('xs').value().isString())

  assert.end()
})

test('tagged template literals also work', function(assert) {
  let cfg = escontrol(espree.parse(`
    let parser = function(strings) {
      return 3
    }
    let xs = parser\`ok \${parser}\`
  `, parseOpts))

  while (cfg.advance()) {
    // nop
  }

  assert.end()
})
