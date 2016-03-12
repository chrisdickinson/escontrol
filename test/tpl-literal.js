'use strict'

const escontrol = require('../index.js')
const espree = require('espree')
const test = require('tape')

const parseOpts = {
  ecmaVersion: 6,
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
  assert.equal(edges.length, 12)
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'LOAD_LITERAL_TEMPLATE',
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

test('interpolation of unknown', function(assert) {
  let cfg = escontrol(espree.parse(`
    var xs = \`hello \${value}\`;
  `, parseOpts))

  while (cfg.advance()) {
    // nop
  }

  const edges = cfg.edges()
  assert.equal(edges.length, 9)
  let idx = 0
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'EXC',
    'LOAD_VALUE', 'LOAD_LITERAL_TEMPLATE',
    'LOAD_LITERAL_TEMPLATE', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'EXIT'
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
  assert.equal(edges.length, 18)
  let idx = 0
  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'LOAD_VALUE',
    'LOAD_VALUE', 'ADD',
    'ADD', 'LOAD_LITERAL_TEMPLATE',
    'LOAD_LITERAL_TEMPLATE', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'EXIT'
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
  const edges = cfg.edges()
  assert.equal(edges.length, 26)
  let idx = 0

  const items = [
    'UNREACHABLE', 'EXC',
    'ENTER', 'ENTER',
    'ENTER', 'LOAD_NAME',
    'LOAD_NAME', 'CREATE_FUNCTION',
    'CREATE_FUNCTION', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'LOAD_NAME',
    'LOAD_NAME', 'LOAD_VALUE',
    'LOAD_VALUE', 'LOAD_VALUE',
    'LOAD_VALUE', 'CALL',
    'CALL', 'CONTEXT_SET',
    'CONTEXT_SET', 'CONTEXT_PUSH',
    'UNREACHABLE', 'EXC',
    'CONTEXT_PUSH', 'ENTER',
    'ENTER', 'CONTEXT_DEFINE',
    'CONTEXT_DEFINE', 'POP',
    'POP', 'ENTER',
    'ENTER', 'LOAD_LITERAL',
    'LOAD_LITERAL', 'EXIT',
    'UNREACHABLE', 'EXIT',
    'EXIT', 'EXIT',
    'EXIT', 'CONTEXT_POP',
    'CONTEXT_POP', 'CONTEXT_RESET',
    'CONTEXT_RESET', 'STORE_VALUE',
    'STORE_VALUE', 'POP',
    'POP', 'EXIT'
  ]

  for (var edge of edges) {
    assert.equal(edge.from.opname(), items[idx])
    assert.equal(edge.to.opname(), items[idx + 1])
    idx += 2
  }
  assert.equal(idx, items.length)

  assert.equal(cfg.global().getprop('xs').value()._type, 'number')

  assert.end()
})
