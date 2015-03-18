module.exports = makeFunction

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var FunctionValue = require('../lib/values/function.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')
var Unknown = require('../lib/values/unknown.js')

function makeFunction(builtins, globals, quickFn) {
  var functionProto = builtins.getprop('[[FunctionProto]]').value()
  var functionCons = quickFn('Function', FunctionImpl, globals)

  functionCons.getprop('prototype').assign(functionProto)
  quickFn('call', CallFunctionImpl, functionProto)
  quickFn('apply', ApplyFunctionImpl, functionProto)
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
    cfg._valueStack.push(new Unknown(cfg._builtins))
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
    var len = 0
    if (args[0]) {
      var lenProp = args[0].getprop('length')
      if (lenProp) {
        len = lenProp.value()._value || 0
      }
    }
    var newArgs = []
    for(var i = 0; i < len; ++i) {
      var prop = args[0].getprop(i)
      if (!prop) {
        newArgs[i] = cfg.makeUndefined()
      } else {
        newArgs[i] = prop.value()
      }
    }
    realFunction.call(cfg, realThis, newArgs)
  } else {
    cfg._valueStack.push(new Unknown(cfg._builtins))
  }
}

function FunctionImpl(cfg, thisValue, args, isNew) {
  var ast = {"type":"FunctionDeclaration","id":{"type":"Identifier","name":"toString"},"params":[],"defaults":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":null}]},"rest":null,"generator":false,"expression":false}

  var sfi = new SharedFunctionInfo(ast)
  cfg._valueStack.push(
    new FunctionValue(
      cfg._builtins,
      ast,
      cfg._builtins.getprop('[[FunctionProto]]').value(),
      '(dynamic function)',
      new ObjectValue(cfg._builtins, hidden.initial.EXPANDO, null),
      sfi,
      null,
      true
    )
  )
}
