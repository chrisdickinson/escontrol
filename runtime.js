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

  var xs = 
[ 'encodeURIComponent',
  'parseFloat',
  'parseInt',
  'Error',
  'EvalError',
  'TypeError',
  'Infinity',
  'URIError',
  'SyntaxError',
  'ReferenceError',
  'decodeURIComponent',
  'Date',
  'isNaN',
  'RangeError',
  'isFinite',
  'undefined',
  'unescape',
  'decodeURI',
  'escape',
  'JSON',
  'NaN',
  'eval',
  'encodeURI' ]
  quickfn('Number', NumberImpl, globals)
  quickfn('Boolean', BooleanImpl, globals)
  quickfn('String', StringImpl, globals)
  quickfn('RegExp', RegExpImpl, globals)
  quickfn('Array', ArrayImpl, globals)
  quickfn('Object', ObjectImpl, globals)
  quickfn('Function', FunctionImpl, globals)
  globals.getprop('Object').value().getprop('prototype').assign(objectProto)
  globals.getprop('Function').value().getprop('prototype').assign(functionProto)
  globals.getprop('Array').value().getprop('prototype').assign(arrayProto)
  globals.getprop('String').value().getprop('prototype').assign(stringProto)
  globals.getprop('Boolean').value().getprop('prototype').assign(booleanProto)
  globals.getprop('Number').value().getprop('prototype').assign(numberProto)
  globals.getprop('RegExp').value().getprop('prototype').assign(regexpProto)

  return

  function quickfn(name, impl, into) {
    var fn = new FunctionValue(
      builtins,
      {},
      functionProto,
      name,
      builtins,
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

function NumberImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    new Value(cfg._builtins, 'number', Number(args[0].toValue()).value)
  )
}

function BooleanImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    new Value(cfg._builtins, 'boolean', !!args[0].toValue().value)
  )
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

function ArrayImpl(cfg, thisValue, args, isNew) {
  // TODO: make this more accurate!
  cfg._valueStack.push(
    new ObjectValue(cfg._builtins, hidden.initial.ARRAY, cfg._builtins.getprop('[[ArrayProto]]').value())
  )
}

function ObjectImpl(cfg, thisValue, args, isNew) {
  // TODO: make this more accurate!
  cfg._valueStack.push(
    new ObjectValue(cfg._builtins, hidden.initial.EMPTY, cfg._builtins.getprop('[[ObjectProto]]').value())
  )
}

function FunctionImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    new FunctionValue(
      builtins,
      {},
      cfg._builtins.getprop('[[FunctionProto]]').value(),
      '(dynamic function)',
      new ObjectValue(cfg._builtins, hidden.initial.EXPANDO, null),
      null,
      null,
      true
    )
  )
}

function MathFunctionImpl(name) {
  return MathFunctionImpl

  function MathFunctionImpl(cfg, thisValue, args, isNew) {
    cfg._connect(cfg.last(), new Operation(Operation.kind['MATH_' + name.toUpperCase()], args[0], args[1], args[2]))
    cfg._valueStack.push(new Value(cfg._builtins, 'number'))
  }
}

