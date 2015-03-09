module.exports = makeBuiltins

var SharedFunctionInfo = require('./lib/values/shared-function-info.js')
var FunctionValue = require('./lib/values/function.js')
var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var Unknown = require('./lib/values/unknown.js')
var Value = require('./lib/values/value.js')

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
  var errorProto = new ObjectValue(null, hidden.initial.EMPTY, objectProto)

  var toStringAST = {"type":"FunctionDeclaration","id":{"type":"Identifier","name":"toString"},"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"BinaryExpression","operator":"+","left":{"type":"BinaryExpression","operator":"+","left":{"type":"Literal","value":"[object ","raw":"\'[object \'"},"right":{"type":"MemberExpression","computed":false,"object":{"type":"MemberExpression","computed":false,"object":{"type":"ThisExpression"},"property":{"type":"Identifier","name":"constructor"}},"property":{"type":"Identifier","name":"name"}}},"right":{"type":"Literal","value":"]","raw":"\']\'"}}}]},"rest":null,"generator":false,"expression":false}

  var toStringSFI = new SharedFunctionInfo(toStringAST)

  var toString = new FunctionValue(root,
      toStringAST,
      functionProto,
      'toString',
      root,
      toStringSFI
  )

  objectProto.newprop('toString').assign(toString)
  quickfn('call', CallFunctionImpl, functionProto)
  quickfn('apply', ApplyFunctionImpl, functionProto)

  root.newprop('[[ObjectProto]]').assign(objectProto)
  root.newprop('[[ArrayProto]]').assign(arrayProto)
  root.newprop('[[RegExpProto]]').assign(regexpProto)
  root.newprop('[[DateProto]]').assign(dateProto)
  root.newprop('[[FunctionProto]]').assign(functionProto)
  root.newprop('[[StringProto]]').assign(stringProto)
  root.newprop('[[NumberProto]]').assign(numberProto)
  root.newprop('[[BooleanProto]]').assign(booleanProto)
  root.newprop('[[ArgumentsProto]]').assign(argumentsProto)
  root.newprop('[[ErrorProto]]').assign(errorProto)

  return root

  function quickfn(name, impl, into) {
    var fn = new FunctionValue(
      root,
      {},
      functionProto,
      name,
      root,
      null,
      null,
      true
    )
    fn.call = impl
    into.newprop(name).assign(fn)
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
    cfg._setBackedge()
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
    cfg._setBackedge()
    cfg._connect(last, cfg._blockStack.root().enter)
    cfg._setLastNode(last)
  }

  if (!realFunction.isUnknown() && realFunction.isFunction() && !recurses) {
    var len = args[0] ? args[0].getprop('length').value() || 0 : 0
    var newArgs = []
    for(var i = 0; i < len; ++i) {
      newArgs[i] = args.getprop(i).value()
    }
    realFunction.call(cfg, realThis, newArgs)
  } else {
    cfg._valueStack.push(new Unknown())
  }
}
