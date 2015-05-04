module.exports = makeFunction
module.exports.callImpl = CallFunctionImpl

function makeFunction(cfg, globals, quickFn) {
  var functionProto = cfg._builtins.getprop('[[FunctionProto]]').value()
  var functionCons = quickFn('Function', FunctionImpl, globals)

  functionCons.getprop('prototype').assign(functionProto)
  quickFn('call', CallFunctionImpl, functionProto)
  quickFn('apply', ApplyFunctionImpl, functionProto)
}

function CallFunctionImpl(cfg, thisValue, args, isNew, shouldBranch) {
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
    cfg._connect(last, recurses.enter ? recurses.enter : cfg._rootBlock().enter)
    cfg._setLastNode(last)
  }

  if (!realFunction.isUnknown() && realFunction.isFunction() && !recurses) {
    realFunction.call(cfg, realThis, args, false, shouldBranch)
  } else {
    cfg._valueStack.push(cfg.makeUnknown())
  }
}

function ApplyFunctionImpl(cfg, thisValue, args, isNew, shouldBranch) {
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
    cfg._connect(last, recurses.enter ? recurses.enter : cfg._rootBlock().enter)
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
    realFunction.call(cfg, realThis, newArgs, false, shouldBranch)
  } else {
    cfg._valueStack.push(cfg.makeUnknown())
  }
}

function FunctionImpl(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(
    cfg.makeFunction(null, null, cfg._builtins.getprop('[[FunctionProto]]').value())
  )
}
