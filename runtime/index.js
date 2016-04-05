module.exports = makeRuntime

var FunctionValue = require('../lib/values/function.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

var builtinFunction = require('./function.js')
var builtinBoolean = require('./boolean.js')
var builtinSymbol = require('./symbol.js')
var builtinString = require('./string.js')
var builtinRegExp = require('./regexp.js')
var builtinObject = require('./object.js')
var builtinNumber = require('./number.js')
var builtinError = require('./errors.js')
var builtinArray = require('./array.js')
var builtinMath = require('./math.js')
var builtinDate = require('./date.js')

function makeRuntime (cfg, globals) {
  var functionProto = cfg._builtins.getprop('[[FunctionProto]]').value()
  var builtins = cfg._builtins

  builtinFunction(cfg, globals, quickfn)
  builtinBoolean(cfg, globals, quickfn)
  builtinObject(cfg, globals, quickfn)
  builtinNumber(cfg, globals, quickfn)
  builtinRegExp(cfg, globals, quickfn)
  builtinString(cfg, globals, quickfn)
  builtinSymbol(cfg, globals, quickfn)
  builtinError(cfg, globals, quickfn)
  builtinArray(cfg, globals, quickfn)
  builtinDate(cfg, globals, quickfn)
  builtinMath(cfg, globals, quickfn)

  /*
  missing:
[ 'encodeURIComponent',
  'decodeURIComponent',
  'Date',
  'undefined',
  'unescape',
  'decodeURI',
  'escape',
  'eval',
  'encodeURI' ]
  */

  var JSON = new ObjectValue(
    cfg,
    hidden.initial.EMPTY,
    builtins.getprop('[[ObjectProto]]').value()
  )
  globals.newprop('JSON').assign(JSON)
  quickfn('parse', JSONParseImpl, JSON)
  quickfn('stringify', JSONStringifyImpl, JSON)

  return

  function quickfn (name, impl, into, instanceHCID) {
    var fn = new FunctionValue(
      cfg,
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

function JSONParseImpl (cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeObject())
}

function JSONStringifyImpl (cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('string'))
}
