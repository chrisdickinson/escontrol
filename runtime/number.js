module.exports = makeNumber

var Value = require('../lib/values/value.js')

function makeNumber(cfg, globals, quickFn) {
  var numberProto = cfg._builtins.getprop('[[NumberProto]]').value()
  var numberCons = quickFn('Number', NumberImpl, globals)

  quickFn('parseFloat', ParseFloatImpl, globals)
  quickFn('parseInt', ParseIntImpl, globals)
  quickFn('isFinite', IsFinite, globals)
  quickFn('isNaN', IsNaN, globals)

  globals.newprop('Infinity').assign(
    cfg.makeValue('number', Infinity)
  )
  globals.newprop('NaN').assign(
    cfg.makeValue('number', NaN)
  )
  numberCons.getprop('prototype').assign(numberProto)
}

function NumberImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('number'))
}

function ParseFloatImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('number'))
}

function ParseIntImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('number'))
}

function IsFinite(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('boolean'))
}

function IsNaN(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('boolean'))
}
