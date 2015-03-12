module.exports = makeRuntime

var FunctionValue = require('../lib/values/function.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')
var Unknown = require('../lib/values/unknown.js')
var Value = require('../lib/values/value.js')
var Operation = require('../operation.js')

var builtinFunction = require('./function.js')
var builtinBoolean = require('./boolean.js')
var builtinObject = require('./object.js')
var builtinNumber = require('./number.js')
var builtinRegExp = require('./regexp.js')
var builtinString = require('./string.js')
var builtinError = require('./errors.js')
var builtinArray = require('./array.js')
var builtinDate = require('./date.js')
var builtinMath = require('./math.js')

function makeRuntime(builtins, globals) {
  var functionProto = builtins.getprop('[[FunctionProto]]').value()

  builtinFunction(builtins, globals, quickfn)
  builtinBoolean(builtins, globals, quickfn)
  builtinObject(builtins, globals, quickfn)
  builtinNumber(builtins, globals, quickfn)
  builtinRegExp(builtins, globals, quickfn)
  builtinError(builtins, globals, quickfn)
  builtinArray(builtins, globals, quickfn)
  builtinMath(builtins, globals, quickfn)

  var xs = 
[ 'encodeURIComponent',
  'decodeURIComponent',
  'Date',
  'undefined',
  'unescape',
  'decodeURI',
  'escape',
  'JSON',
  'eval',
  'encodeURI' ]

  return

  function quickfn(name, impl, into, instanceHCID) {
    var fn = new FunctionValue(
      builtins,
      {},
      functionProto,
      name,
      builtins,
      null,
      instanceHCID || null,
      true
    )
    fn.call = impl
    into.newprop(name).assign(fn)
    return fn
  }
}

function StringImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    new Value(cfg._builtins, 'string', String(args[0].toValue().value))
  )
}

function RegExpImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    new ObjectValue(cfg._builtins, hidden.initial.REGEXP, cfg._builtins.getprop('[[RegExpProto]]').value())
  )
}
