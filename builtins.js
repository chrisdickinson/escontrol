module.exports = makeBuiltins

var SharedFunctionInfo = require('./lib/values/shared-function-info.js')
var FunctionValue = require('./lib/values/function.js')
var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var Unknown = require('./lib/values/unknown.js')
var Value = require('./lib/values/value.js')

function makeBuiltins(cfg) {
  var root = new ObjectValue(cfg, hidden.initial.SCOPE, null)

  var objectProto = new ObjectValue(cfg, hidden.initial.EMPTY, null)
  var arrayProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var regexpProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var dateProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var functionProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var stringProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var numberProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var booleanProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var argumentsProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var errorProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)
  var symbolProto = new ObjectValue(cfg, hidden.initial.EMPTY, objectProto)

  root.newprop('[[ObjectProto]]').assign(objectProto)
  root.newprop('[[ArrayProto]]').assign(arrayProto)
  root.newprop('[[RegExpProto]]').assign(regexpProto)
  root.newprop('[[DateProto]]').assign(dateProto)
  root.newprop('[[FunctionProto]]').assign(functionProto)
  root.newprop('[[StringProto]]').assign(stringProto)
  root.newprop('[[NumberProto]]').assign(numberProto)
  root.newprop('[[BooleanProto]]').assign(booleanProto)
  root.newprop('[[ArgumentsProto]]').assign(argumentsProto)
  root.newprop('[[ErrorProto]]').assign(errorProto)
  root.newprop('[[SymbolProto]]').assign(symbolProto)

  return root
}
