
module.exports = makeArray

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeArray(builtins, globals, quickFn) {
  var arrayProto = builtins.getprop('[[ArrayProto]]').value()
  var arrayCons = quickFn('Array', ArrayImpl, globals, hidden.initial.ARRAY)

  arrayCons.getprop('prototype').assign(arrayProto)
}

function ArrayImpl(cfg, thisValue, args, isNew) {
  var out = this.makeNew()
  cfg._valueStack.push(out)
}
