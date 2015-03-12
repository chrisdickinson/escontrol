module.exports = makeNumber

var Value = require('../lib/values/value.js')

function makeNumber(builtins, globals, quickFn) {
  var numberProto = builtins.getprop('[[NumberProto]]').value()
  var numberCons = quickFn('Number', NumberImpl, globals)

  quickFn('parseFloat', ParseFloatImpl, globals)
  quickFn('parseInt', ParseIntImpl, globals)
  quickFn('isFinite', IsFinite, globals)
  quickFn('isNaN', IsNaN, globals)

  globals.newprop('Infinity').assign(new Value(
    builtins,
    'number',
    Infinity
  ))
  globals.newprop('NaN').assign(new Value(
    builtins,
    'number',
    NaN
  ))
  numberCons.getprop('prototype').assign(numberProto)
}

function NumberImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(new Value(cfg._builtins, 'number'))
}

function ParseFloatImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(new Value(cfg._builtins, 'number'))
}

function ParseIntImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(new Value(cfg._builtins, 'number'))
}

function IsFinite(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(new Value(cfg._builtins, 'boolean'))
}

function IsNaN(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(new Value(cfg._builtins, 'boolean'))
}
