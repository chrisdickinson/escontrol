module.exports = makeBuiltins

var FunctionValue = require('./lib/values/function.js')
var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')

function makeBuiltins() {
  var root = new ObjectValue(null, hidden.initial.EMPTY, null)

  var objectProto = new ObjectValue(null, hidden.initial.EMPTY, null)
  var arrayProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var regexpProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var dateProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var functionProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var stringProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var numberProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var booleanProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)
  var argumentsProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)

  var toString = new FunctionValue(root,
      {"type":"FunctionDeclaration","id":{"type":"Identifier","name":"toString"},"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"BinaryExpression","operator":"+","left":{"type":"BinaryExpression","operator":"+","left":{"type":"Literal","value":"[object ","raw":"\'[object \'"},"right":{"type":"MemberExpression","computed":false,"object":{"type":"MemberExpression","computed":false,"object":{"type":"ThisExpression"},"property":{"type":"Identifier","name":"constructor"}},"property":{"type":"Identifier","name":"name"}}},"right":{"type":"Literal","value":"]","raw":"\']\'"}}}]},"rest":null,"generator":false,"expression":false},
      functionProto,
      'toString',
      root
  )

  objectProto.newprop('toString').assign(toString)

  root.newprop('[[ObjectProto]]').assign(objectProto)
  root.newprop('[[ArrayProto]]').assign(arrayProto)
  root.newprop('[[RegExpProto]]').assign(regexpProto)
  root.newprop('[[DateProto]]').assign(dateProto)
  root.newprop('[[FunctionProto]]').assign(functionProto)
  root.newprop('[[StringProto]]').assign(stringProto)
  root.newprop('[[NumberProto]]').assign(numberProto)
  root.newprop('[[BooleanProto]]').assign(booleanProto)
  root.newprop('[[ArgumentsProto]]').assign(argumentsProto)

  return root
}
