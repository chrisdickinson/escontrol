'use strict'

module.exports = makeString

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeString(builtins, globals, quickFn) {
  var stringProto = builtins.getprop('[[StringProto]]').value()
  var stringCons = quickFn('String', StringImpl, globals, hidden.initial.STRING)

  stringCons.getprop('prototype').assign(stringProto)
}

function StringImpl(cfg, thisValue, args, isNew) {
  var out = isNew ? this.makeNew() : cfg.makeValue(
    'string'
  )
  cfg._valueStack.push(out)
}
