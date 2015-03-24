module.exports = makeErrors

var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')
var Value = require('../lib/values/value.js')

function makeErrors(builtins, globals, quickFn) {
  var errorProto = builtins.getprop('[[ErrorProto]]').value()
  var errorCons = quickFn('Error', ErrorImpl, globals)
  errorCons.getprop('prototype').assign(errorProto)

  var subclasses = [
    'EvalError',
    'TypeError',
    'URIError',
    'SyntaxError',
    'ReferenceError',
    'RangeError'
  ]

  subclasses.forEach(function(name) {
    var cons = quickFn(name, ErrorImpl, globals)
    var obj = new ObjectValue(builtins, hidden.initial.EMPTY, errorProto)
    cons.getprop('prototype').assign(obj)
    builtins.newprop('[[' + name + ']]').assign(cons)
  })
}

function ErrorImpl(cfg, thisValue, args, isNew) {
  // FIXME: this is made out of lies
  cfg._valueStack.push(new Value(cfg._builtins, 'string'))
}

