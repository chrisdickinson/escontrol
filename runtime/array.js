
module.exports = makeArray

var SharedFunctionInfo = require('../lib/values/shared-function-info.js')
var hidden = require('../lib/values/hidden-class.js')
var ObjectValue = require('../lib/values/object.js')

function makeArray(builtins, globals, quickFn) {
  var arrayProto = builtins.getprop('[[ArrayProto]]').value()
  var arrayCons = quickFn('Array', ArrayImpl, globals, hidden.initial.ARRAY)

  quickFn('isArray', IsArray, arrayCons)

  quickFn('indexOf', ReturnIndex, arrayProto)
  quickFn('lastIndexOf', ReturnIndex, arrayProto)
  quickFn('push', ReturnLen, arrayProto)
  quickFn('unshift', ReturnLen, arrayProto)
  quickFn('join', ReturnStr, arrayProto)
  quickFn('concat', ReturnArr, arrayProto)
  quickFn('reverse', ReturnArr, arrayProto)
  quickFn('splice', ReturnArr, arrayProto)
  quickFn('slice', ReturnArr, arrayProto)
  quickFn('sort', ReturnArr, arrayProto)
  quickFn('shift', ReturnValue, arrayProto)
  quickFn('pop', ReturnValue, arrayProto)

  // calls callback!
  quickFn('reduce', ArrayReduce, arrayProto)
  quickFn('reduceRight', ArrayReduceRight, arrayProto)
  quickFn('filter', ArrayFilter, arrayProto)
  quickFn('map', ArrayMap, arrayProto)
  quickFn('forEach', ArrayForEach, arrayProto)
  quickFn('some', ArraySome, arrayProto)
  quickFn('every', ArrayEvery, arrayProto)

  arrayCons.getprop('prototype').assign(arrayProto)
  arrayProto.newprop('constructor').assign(arrayCons)
  builtins.newprop('[[ArrayConstructor]]').assign(arrayCons)

  function ReturnArr(cfg, thisValue, args, isNew) {
    var out = arrayCons.makeNew()
    cfg._valueStack.push(out)
  }
}

function ArrayImpl(cfg, thisValue, args, isNew) {
  var out = this.makeNew()
  cfg._valueStack.push(out)
}

function IsArray(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('boolean'))
}

function ReturnIndex(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('number'))
}

function ReturnLen(cfg, thisValue, args, isNew) {
  // separated from ReturnIndex because number type
  // may eventually have invariants (e.g., ">0", "[N...M)")
  cfg._valueStack.push(cfg.makeValue('number'))
}

function ReturnStr(cfg, thisValue, args, isNew) {
  cfg._valueStack.push(cfg.makeValue('string'))
}

function ReturnValue(cfg, thisValue, args, isNew) {
  // there's no way of knowing!
  cfg._valueStack.push(cfg.makeUnknown())
}

function ArrayEvery(cfg, thisValue, args, isNew) {
  // [].every
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(cfg.makeValue('boolean'))
    return
  }
  var cb = args[0]
  var ctx = args[1] || cfg.global()
  cfg._pushFrame(onret)
  cb.call(cfg, ctx, [
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()
    cfg._valueStack.push(cfg.makeValue('boolean'))
  }
}

function ArrayFilter(cfg, thisValue, args, isNew) {
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(
      cfg._builtins.getprop('[[ArrayConstructor]]').value().makeNew()
    )
    return
  }
  var cb = args[0]
  var ctx = args[1] || cfg.global()
  cfg._pushFrame(onret)
  cb.call(cfg, ctx, [
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()

    cfg._valueStack.push(
      cfg._builtins.getprop('[[ArrayConstructor]]').value().makeNew()
    )
  }
}

function ArrayForEach(cfg, thisValue, args, isNew) {
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(cfg.makeUndefined())
    return
  }
  var cb = args[0]
  var ctx = args[1] || cfg.global()
  cfg._pushFrame(onret)
  cb.call(cfg, ctx, [
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()
    cfg._valueStack.push(cfg.makeUndefined())
  }
}

function ArrayMap(cfg, thisValue, args, isNew) {
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(cfg.makeUnknown())
    return
  }
  var cb = args[0]
  var ctx = args[1] || cfg.global()
  cfg._pushFrame(onret)
  cb.call(cfg, ctx, [
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()
    cfg._valueStack.push(
      cfg._builtins.getprop('[[ArrayConstructor]]').value().makeNew()
    )
  }
}

function ArrayReduce(cfg, thisValue, args, isNew) {
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(cfg.makeUnknown())
    return
  }
  if (false && thisValue._static) {
    return staticReduce(cfg, thisValue, args, isNew)
  }
  var cb = args[0]
  cfg._pushFrame(onret)
  cb.call(cfg, cfg.global(), [
    cfg.makeUnknown(),
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()
    cfg._valueStack.push(cfg.makeUnknown())
  }
}

// XXX: this is a hack.
//
// how to make it *not* a hack: add functionality such that
// we can tell when an array value is closed over. if its closed
// over, remove _static.
//
// also, if there's a branch, treat `push`, `unshift`, and friends
// as *mutating* functions.
function staticReduce(cfg, thisValue, args, isNew) {
  var cb = args[0]
  var init = args[1]
  var len = thisValue.getprop('length').value()._value
  var items = []
  for(var i = 0; i < len; ++i) {
    items.push(thisValue.getprop(i).value())
  }

  if (init) {
    items.unshift(init)
  }

  cfg._valueStack.push(items.shift())
  return iterate()

  function iterate() {
    if (!items.length) {
      return
    }
    var last = cfg._valueStack.pop()
    cfg._pushFrame(iterate)
    cb.call(cfg, cfg.global(), [
      last,
      items.shift(),
      cfg.makeValue('number'),
      thisValue
    ])
  }
}

function ArrayReduceRight(cfg, thisValue, args, isNew) {
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(cfg.makeUnknown())
    return
  }
  var cb = args[0]
  cfg._pushFrame(onret)
  cb.call(cfg, cfg.global(), [
    cfg.makeUnknown(),
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()
    cfg._valueStack.push(cfg.makeUnknown())
  }
}

function ArraySome(cfg, thisValue, args, isNew) {
  if (!args[0] || !args[0].isFunction() || !args[0].call) {
    cfg._valueStack.push(cfg.makeValue('boolean'))
    return
  }
  var cb = args[0]
  var ctx = args[1] || cfg.global()
  cfg._pushFrame(onret)
  cb.call(cfg, ctx, [
    cfg.makeUnknown(),
    cfg.makeValue('number'),
    thisValue
  ])

  function onret() {
    cfg._valueStack.pop()
    cfg._valueStack.push(cfg.makeValue('boolean'))
  }
}
