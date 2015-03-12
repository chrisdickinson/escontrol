module.exports = makeFunction

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

function FunctionImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    new FunctionValue(
      cfg._builtins,
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
