module.exports = makeObject

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var FunctionValue = require('../lib/values/function.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeObject(builtins, globals, quickFn) {
  var functionProto = builtins.getprop('[[FunctionProto]]').value()
  var objectProto = builtins.getprop('[[ObjectProto]]').value()
  var toStringAST = {"type":"FunctionDeclaration","id":{"type":"Identifier","name":"toString"},"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"BinaryExpression","operator":"+","left":{"type":"BinaryExpression","operator":"+","left":{"type":"Literal","value":"[object ","raw":"\'[object \'"},"right":{"type":"MemberExpression","computed":false,"object":{"type":"MemberExpression","computed":false,"object":{"type":"ThisExpression"},"property":{"type":"Identifier","name":"constructor"}},"property":{"type":"Identifier","name":"name"}}},"right":{"type":"Literal","value":"]","raw":"\']\'"}}}]},"rest":null,"generator":false,"expression":false}

  var toStringSFI = new SharedFunctionInfo(toStringAST)
  var objectCons = quickFn('Object', ObjectImpl, globals)

  var toString = new FunctionValue(
    builtins,
    toStringAST,
    functionProto,
    'toString',
    globals,
    toStringSFI
  )

  objectProto.newprop('toString').assign(toString)
  objectCons.getprop('prototype').assign(objectProto)
}

function ObjectImpl(cfg, thisValue, args, isNew) {
  // TODO: make this more accurate!
  cfg._valueStack.push(
    new ObjectValue(cfg._builtins, hidden.initial.EMPTY, cfg._builtins.getprop('[[ObjectProto]]').value())
  )
}
