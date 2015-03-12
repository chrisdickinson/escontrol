
module.exports = makeRegExp

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeRegExp(builtins, globals, quickFn) {
  var regexpProto = builtins.getprop('[[RegExpProto]]').value()
  var regexpCons = quickFn('RegExp', RegExpImpl, globals, hidden.initial.REGEXP)

  regexpCons.getprop('prototype').assign(regexpProto)
}

function RegExpImpl(cfg, thisValue, args, isNew) {
  var out = this.makeNew()
  cfg._valueStack.push(out)
}
