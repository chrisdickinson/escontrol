'use strict'

module.exports = FunctionValue

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var Undefined = require('./undefined.js')
var ObjectValue = require('./object.js')
var Either = require('./either.js')
var Value = require('./value.js')
var Name = require('./name.js')

function FunctionValue(cfg,
                       code,
                       prototype,
                       name,
                       context,
                       shared,
                       childHCID,
                       isStrict,
                       parentMap) {
  var fnProto

  ObjectValue.call(
    this,
    cfg,
    hidden.initial.FUNCTION,
    cfg ? (fnProto = cfg._builtins.getprop('[[FunctionProto]]')) ? fnProto.value() : null : null,
    parentMap
  )
  this._code = code

  name = name || '(anonymous ' + (FunctionValue.anonymousIds++) + ')' 
  this._name = name
  this._context = new Name('[[Scope]]') 
  this._context.assign(context)
  this._childHCID = childHCID || null
  this._isStrict = isStrict || (
    code.body.body &&
    code.body.body[0] &&
    code.body.body[0].value === 'use strict'
  )
  this._sharedFunctionInfo = shared

  this.newprop('prototype').assign(prototype)
  prototype.newprop('constructor').assign(this)
}

inherits(FunctionValue, ObjectValue)

FunctionValue.anonymousIds = 0

var proto = FunctionValue.prototype

proto.isStrict = function() {
  return this._isStrict
}

proto.classInfo = function() {
  return 'function ' + this._name + ' ' + (
      this._sharedFunctionInfo ? 
        ' :: ' + this._sharedFunctionInfo.signature() :
        '[native code]'
  )
}

proto.sharedFunctionInfo = function() {
  return this._sharedFunctionInfo
}

proto.copy = function FunctionValue_copy() {
  var copy = new FunctionValue(
    this.cfg,
    this._code,
    this.getprop('prototype').value(),
    this._name,
    this._context.value(),
    this._sharedFunctionInfo,
    this._childHCID,
    this._isStrict,
    this._attributes
  )

  if (copy.call !== this.call) {
    copy.call = this.call
  }

  if (copy.instantiate !== this.instantiate) {
    copy.instantiate = this.instantiate
  }

  return copy
}

proto.call = function FunctionValue_call(cfg, thisValue, args, isNew, shouldBranch) {
  // step one: scream for a while, okay
  // step two: electric boogaloo
  var oldScope = cfg._scopeStack.current()
  var oldLast = cfg.last()
  var branchID

  var Arguments = new ObjectValue(
    cfg,
    hidden.initial.ARGUMENTS,
    this.cfg._builtins.getprop('[[ArgumentsProto]]').value()
  )
  Arguments.newprop('length').assign(cfg.makeValue('number', args.length))

  cfg._callStack.pushFrame(this, thisValue, Arguments, isNew, cfg._currentBlock())
  cfg._pushBlock(this._code, true, null)
  cfg._connect(cfg.last(), cfg._currentBlock().enter)
  cfg._scopeStack.set(this._context.value())
  var branchId = null
  if (shouldBranch) {
    branchId = cfg._branchOpen()
  }
  cfg._scopeStack.push(cfg._currentBlock())

  for(var i = 0, len = this._code.params.length; i < len; ++i) {
    var name = cfg._scopeStack.newprop(this._code.params[i].name)
    name.assign(args[i] || Undefined())

    if (this._isStrict) {
      Arguments.newprop(i).assign(name.value())
    } else {
      Arguments._attributes.set(i, name)
    }
  }

  if (this._code.id) {
    cfg._scopeStack.newprop(this._code.id.name).assign(this)
  }

  // TODO: arguments.callee = this
  // this.caller = previous stack frame
  var callId = this._sharedFunctionInfo.recordCall(thisValue, Arguments, args, isNew)
  cfg._pushFrame(CFG_afterCall, {
    fn: this,
    branchId: branchId,
    oldScope: oldScope,
    oldLast: oldLast,
    callId: callId
  })
  cfg._visit(this._code.body)
  cfg._hoist(this._code)

  cfg._valueStack.fence()
}

function CFG_afterCall(context) {
  var block = this._popBlock()
  this._valueStack.unfence()

  this._scopeStack.pop()
  if (context.branchId !== null) {
    this._branchEnd(context.branchId)
  }
  this._scopeStack.set(context.oldScope)

  this._callStack.popFrame()
  this._connect(this.last(), block.exit)
  // XXX: lastNode stuff is a bad idea. this._setLastNode(context.oldLast)
  var candidates = this._getEdgesTo(block.exit)
  var values = []

  for(var i = 0, len = candidates.length; i < len; ++i) {
    if (candidates[i].value) {
      values[i] = candidates[i].value

      // get rid of the retained value.
      candidates[i].value = null
    }
  }

  if (values.length === 1) {
    this._valueStack.push(values[0])
  } else if(values.length > 1) {
    this._valueStack.push(Either.from(values))
  } else {
    this._valueStack.push(Undefined())
  }

  context.fn._sharedFunctionInfo.recordReturn(context.callId, this._valueStack.current())
}

proto.makeNew = function FunctionValue_makeNew() {
  var prototype = this.getprop('prototype').value()
  return this.cfg.makeObject(this._childHCID, prototype)
}

proto.instantiate = function FunctionValue_instantiate(cfg, args) {
  // lazy allocate!
  this._childHCID = this._childHCID === null ? hidden.reserve(this._name) : this._childHCID
  var value = this.makeNew()
  cfg._pushFrame(CFG_visitedInstantiate, {
    value: value,
    fn: this
  })
  this.call(cfg, value, args, true)
}

function CFG_visitedInstantiate(context) {
  var cfg = this

  if (cfg._valueStack.current().isObject()) {
    return
  }

  cfg._valueStack.pop()
  cfg._valueStack.push(context.value)
}

proto.isFunction = function() {
  return true
}
