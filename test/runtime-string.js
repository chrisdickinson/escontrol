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

test('should return string', function(assert) {
  const names = [
    'anchor',
    'big',
    'blink',
    'bold',
    'fixed',
    'fontcolor',
    'fontsize',
    'italics',
    'link',
    'small',
    'sub',
    'strike',
    'sup',
    'charAt',
    'concat',
    'normalize',
    'repeat',
    'slice',
    'substr',
    'substring',
    'toLocaleLowerCase',
    'toLocaleUpperCase',
    'toLowerCase',
    'toString',
    'toUpperCase',
    'trim',
    'trimLeft',
    'trimRight',
    'valueOf'
  ]

  for (const name of names) {
    const cfg = escontrol(espree.parse(`
      var xs = 'a string'
      var result = xs.${name}()
    `, parseOpts))
    while (cfg.advance()) {
      ;
    }
    assert.ok(cfg.global().getprop('result'))
    assert.ok(cfg.global().getprop('result').value())
    assert.ok(cfg.global().getprop('result').value().isString())
  }
  assert.end()
})

test('should return boolean', function(assert) {
  const names = [
    'endsWith',
    'includes',
    'startsWith'
  ]

  for (const name of names) {
    const cfg = escontrol(espree.parse(`
      var xs = 'a string'
      var result = xs.${name}()
    `, parseOpts))
    while (cfg.advance()) {
      ;
    }
    assert.ok(cfg.global().getprop('result'))
    assert.ok(cfg.global().getprop('result').value())
    assert.equal(cfg.global().getprop('result').value()._type, 'boolean')
  }
  assert.end()
})

test('should return number', function(assert) {
  const names = [
    'charCodeAt',
    'codePointAt',
    'indexOf',
    'lastIndexOf',
    'localeCompare',
    'search'
  ]

  for (const name of names) {
    const cfg = escontrol(espree.parse(`
      var xs = 'a string'
      var result = xs.${name}()
    `, parseOpts))
    while (cfg.advance()) {
      ;
    }
    assert.ok(cfg.global().getprop('result'))
    assert.ok(cfg.global().getprop('result').value())
    assert.equal(cfg.global().getprop('result').value()._type, 'number')
  }
  assert.end()
})

test('replace should call function if given', function(assert) {
  const cfg = escontrol(espree.parse(`
    var xs = 'a string'
    xs.replace(/anything/, function() {
      xs = 'ok'  
    })
  `, parseOpts))
  while (cfg.advance()) {
    ;
  }
  assert.ok(cfg.global().getprop('xs').value().isEither())

  let outcomes = cfg.global().getprop('xs').value()._outcomes.values()

  assert.equal(outcomes.next().value._value, 'a string')
  assert.equal(outcomes.next().value._value, 'ok')
  assert.end()
})
