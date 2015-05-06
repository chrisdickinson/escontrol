
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

test('onunlink severs vertices', function(assert) {
  const vertices = new Set()
  const edgeMap = new Map()
  const edges = new Set()
  const nullRoot = {}

  const cfg = escontrol(espree.parse(`
    JSON.stringify = 3;
  `, parseOpts), {
    onvalue: onvalue,
    onlink: onlink,
    onunlink: onunlink
  })

  const source = cfg.global().getprop('JSON').value()
  const oldTarget = source.getprop('stringify').value()
  assert.ok(
    edgeMap.get(source).get('stringify').get(oldTarget),
    'JSON.stringify has old target'
  )

  while (cfg.advance()) {
    ;
  }

  const newTarget = source.getprop('stringify').value()
  assert.ok(
    !edgeMap.get(source).get('stringify').get(oldTarget),
    'JSON.stringify does not have old target'
  )
  assert.ok(
    edgeMap.get(source).get('stringify').get(newTarget),
    'JSON.stringify has new target'
  )

  assert.end()

  function onvalue(value) {
    vertices.add(value)
  }

  function onlink(from, to, via) {
    from = from || nullRoot
    const tuple = [from, to, via]
    if (!edgeMap.has(from)) {
      edgeMap.set(from, new Map())
    }
    if (!edgeMap.get(from).has(via)) {
      edgeMap.get(from).set(via, new Map())
    }
    edgeMap.get(from).get(via).set(to, tuple)
    edges.add(tuple)
  }

  function onunlink(from, to, via) {
    from = from || nullRoot
    var tuple = edgeMap.get(from).get(via).get(to)
    edgeMap.get(from).get(via).delete(to)
    edgeMap.get(from).delete(via)
    edges.delete(tuple)
  }
})
