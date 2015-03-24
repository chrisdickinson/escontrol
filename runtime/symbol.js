'use strict'

module.exports = makeSymbol

var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')
var Value = require('../lib/values/value.js')

function makeSymbol(builtins, globals, quickFn) {
  var symbolProto = builtins.getprop('[[SymbolProto]]').value()
  var symbolCons = quickFn('Symbol', SymbolProto, globals, hidden.initial.SYMBOL)

  symbolCons.getprop('prototype').assign(symbolProto)
}

function SymbolProto(cfg, thisValue, args, isNew) {
  if (isNew) {
    cfg._throwException('TypeError')
    return cfg._valueStack.push(cfg.makeUnknown())
  }
  cfg._valueStack.push(cfg.makeValue('symbol', args[0] && args[0]._value))
}
