module.exports = makeMath

var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')
var Value = require('../lib/values/value.js')
var Operation = require('../operation.js')

function makeMath(builtins, globals, quickFn) {
  var objectProto = builtins.getprop('[[ObjectProto]]').value()
  var MathObject = new ObjectValue(builtins, hidden.initial.EMPTY, objectProto)
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
    quickFn(xs, MathFunctionImpl(xs), MathObject)
  })
}

function MathFunctionImpl(name) {
  return MathFunctionImpl

  function MathFunctionImpl(cfg, thisValue, args, isNew) {
    cfg._connect(cfg.last(), new Operation(Operation.kind['MATH_' + name.toUpperCase()], args[0], args[1], args[2]))
    cfg._valueStack.push(new Value(cfg._builtins, 'number'))
  }
}

