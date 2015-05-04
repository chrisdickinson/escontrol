module.exports = makeDate

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeDate(cfg, globals, quickFn) {
  var dateProto = cfg._builtins.getprop('[[DateProto]]').value()
  var dateCons = quickFn('Date', DateImpl, globals, hidden.initial.DATE)

  dateCons.getprop('prototype').assign(dateProto)
}

function DateImpl(cfg, thisValue, args, isNew) {
  var out = this.makeNew()
  cfg._valueStack.push(out)
}

