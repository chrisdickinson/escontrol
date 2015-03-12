module.exports = makeBoolean

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeBoolean(builtins, globals, quickFn) {
  var booleanProto = builtins.getprop('[[BooleanProto]]').value()
  var booleanCons = quickFn('Boolean', BooleanImpl, globals, hidden.initial.BOOLEAN)

  booleanCons.getprop('prototype').assign(booleanProto)
}

function BooleanImpl(cfg, thisValue, args, isNew) {
  var out = isNew ? this.makeNew() : cfg.makeValue(
    'boolean',
    args.length < 1 ? false :
    args[0].isUnknown() ? args[0].isFunction() : 
    Boolean(args[0]._value)
  )
  cfg._valueStack.push(out)
}
