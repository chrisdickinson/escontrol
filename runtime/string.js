'use strict'

module.exports = makeString

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')
var Either = require('../lib/values/either.js')
var Null = require('../lib/values/null.js')
var CallImpl = require('./function.js').callImpl

function makeString(cfg, globals, quickFn) {
  var stringProto = cfg._builtins.getprop('[[StringProto]]').value()
  var stringCons = quickFn('String', StringImpl, globals, hidden.initial.STRING)

  stringCons.getprop('prototype').assign(stringProto)

  const htmlCruft = [
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
    'sup'
  ]

  const returnsString = [
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

  const returnsNumber = [
    'charCodeAt',
    'codePointAt',
    'indexOf',
    'lastIndexOf',
    'localeCompare',
    'search'
  ]

  const returnsBoolean = [
    'endsWith',
    'includes',
    'startsWith'
  ]

  for (const name of htmlCruft.concat(returnsString)) {
    quickFn(name, ReturnString, stringProto)
  }

  for (const name of returnsNumber) {
    quickFn(name, ReturnNumber, stringProto)
  }

  for (const name of returnsBoolean) {
    quickFn(name, ReturnBoolean, stringProto)
  }

  quickFn('split', ReturnArray, stringProto)
  quickFn('replace', StringReplace, stringProto)
  quickFn('match', ReturnArrayOrNull, stringProto)

  stringProto.newprop('constructor').assign(stringCons)
}

function StringImpl(cfg, thisValue, args, isNew) {
  var out = isNew ? this.makeNew() : cfg.makeValue(
    'string'
  )
  cfg._valueStack.push(out)
}

function ReturnString(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('string'))
}

function ReturnNumber(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('number'))
}

function ReturnBoolean(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('boolean'))
}

function ReturnArray(cfg, thisValue, args, isNew) {
  var value = cfg._builtins.getprop('[[ArrayConstructor]]').value().makeNew()
  value.newprop('length').assign(cfg.makeValue('number'))
  value.newprop('0').assign(cfg.makeValue('string'))
  cfg._valueStack.push(value)
}

function ReturnArrayOrNull(cfg, thisValue, args, isNew) {
  var value = cfg._builtins.getprop('[[ArrayConstructor]]').value().makeNew()
  value.newprop('length').assign(cfg.makeValue('number'))
  value.newprop('0').assign(cfg.makeValue('string'))
  value.newprop('index').assign(cfg.makeValue('number'))
  value.newprop('input').assign(cfg.makeValue('string'))

  var values = Either.from(cfg, [value, cfg.makeNull()])
  cfg._valueStack.push(values)
}

function StringReplace(cfg, thisValue, args, isNew) {
  if (args[1] && args[1].isFunction()) {
    cfg._pushFrame(afterStringReplaceCall)
    return CallImpl(cfg, args[1], [
      cfg.global(),
      cfg.makeValue('string'),
      cfg.makeValue('number'),
      cfg.makeValue('string')
    ], false, true)
  }
  cfg._valueStack.push(cfg.makeValue('string'))
}

function afterStringReplaceCall() {
  this._valueStack.pop()
  this._valueStack.push(this.makeValue('string'))
}
