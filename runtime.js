module.exports = makeRuntime

var FunctionValue = require('./lib/values/function.js')
var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var Unknown = require('./lib/values/unknown.js')
var Value = require('./lib/values/value.js')
var Operation = require('./operation.js')

function makeRuntime(builtins, globals) {
  var objectProto = builtins.getprop('[[ObjectProto]]').value()
  var arrayProto = builtins.getprop('[[ArrayProto]]').value()
  var regexpProto = builtins.getprop('[[RegExpProto]]').value()
  var dateProto = builtins.getprop('[[DateProto]]').value()
  var functionProto = builtins.getprop('[[FunctionProto]]').value()
  var stringProto = builtins.getprop('[[StringProto]]').value()
  var numberProto = builtins.getprop('[[NumberProto]]').value()
  var booleanProto = builtins.getprop('[[BooleanProto]]').value()
  var argumentsProto = builtins.getprop('[[ArgumentsProto]]').value()

  var MathObject = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  MathObject.newprop('E').assign(new Value(builtins, 'number'))
  globals.newprop('Math').assign(MathObject)
  var numberProps = [
    'E',
    'LN10',
    'LN2',
    'LOG2E',
    'LOG10E',
    'PI',
    'SQRT1_2',
    'SQRT2'
  ]

  numberProps.forEach(function(xs) {
    MathObject.newprop(xs).assign(new Value(builtins, 'number'))
  })

  var mathFunctions = [
    'random',
    'abs',
    'acos',
    'asin',
    'atan',
    'ceil',
    'cos',
    'exp',
    'floor',
    'log',
    'round',
    'sin',
    'sqrt',
    'tan',
    'atan2',
    'pow',
    'max',
    'min' 
  ]

  mathFunctions.forEach(function(xs) {
    quickfn(xs, MathFunctionImpl(xs), MathObject)
  })

  quickfn('call', CallFunctionImpl, functionProto)
  quickfn('apply', ApplyFunctionImpl, functionProto)

  function quickfn(name, impl, into) {
    var fn = new FunctionValue(
      builtins,
      null,
      functionProto,
      name,
      root,
      null,
      null,
      true
    )
    fn.call = impl
    fn.copy = function() {
      var result = FunctionValue.prototype.copy.apply(this, arguments)
      result.call = impl
      return result
    }
    into.newprop(name).assign(fn)
  }
}

function MathFunctionImpl(name) {
  return MathFunctionImpl

  function MathFunctionImpl(cfg, thisValue, args, isNew) {
    cfg._connect(cfg.last(), new Operation(Operation.kind['MATH_' + name.toUpperCase()], args[0], args[1], args[2]))
    cfg._valueStack.push(new Value(cfg._builtins, 'number'))
  }
}

function CallFunctionImpl(cfg, thisValue, args, isNew) {
  var realFunction = thisValue
  var realThis = args.shift()

  if (realFunction.isUnknown()) {
    if (!realFunction.isFunction()) {
      cfg._throwException('TypeError')
    }
    realFunction.assumeFunction()
  } else if (!realFunction.isFunction()) {
    cfg._throwException('TypeError')
    cfg._connect(cfg.last(), cfg._createUnreachable())
  }

  var recurses = cfg._callStack.isRecursion(realFunction)

  if (recurses) {
    var last = cfg.last()
    cfg._connect(last, cfg._blockStack.root().enter)
    cfg._setLastNode(last)
  }

  if (!realFunction.isUnknown() && realFunction.isFunction() && !recurses) {
    realFunction.call(cfg, realThis, args)
  } else {
    cfg._valueStack.push(new Unknown())
  }
}

function ApplyFunctionImpl(cfg, thisValue, args, isNew) {
  var realFunction = thisValue
  var realThis = args.shift()

  if (realFunction.isUnknown()) {
    if (!realFunction.isFunction()) {
      cfg._throwException('TypeError')
    }
    realFunction.assumeFunction()
  } else if (!realFunction.isFunction()) {
    cfg._throwException('TypeError')
    cfg._connect(cfg.last(), cfg._createUnreachable())
  }

  var recurses = cfg._callStack.isRecursion(realFunction)

  if (recurses) {
    var last = cfg.last()
    cfg._connect(last, cfg._blockStack.root().enter)
    cfg._setLastNode(last)
  }

  if (!realFunction.isUnknown() && realFunction.isFunction() && !recurses) {
    var len = args[0] ? args[0].getprop('length').value() || 0 : 0
    var newArgs = []
    console.error(args)
    for(var i = 0; i < len; ++i) {
      newArgs[i] = args.getprop(i).value()
    }

    console.error(newArgs)
    realFunction.call(cfg, realThis, newArgs)
  } else {
    cfg._valueStack.push(new Unknown())
  }
}
