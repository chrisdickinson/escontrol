'use strict'

module.exports = FunctionValue

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var Undefined = require('./undefined.js')
var ObjectValue = require('./object.js')
var Either = require('./either.js')
var Value = require('./value.js')
var Name = require('./name.js')

function FunctionValue(builtins, code, prototype, name, context, shared, childHCID, isStrict) {

  var fnProto

  ObjectValue.call(
    this,
    builtins,
    hidden.initial.FUNCTION,
    builtins ? (fnProto = builtins.getprop('[[FunctionProto]]')) ? fnProto.value() : null : null
  )
  this._code = code

  name = name || '(anonymous ' + (FunctionValue.anonymousIds++) + ')' 
  this._name = name
  this._context = context
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

proto.copy = function FunctionValue_copy() {
  var copy = new FunctionValue(
    this._builtins,
    this._code,
    this.getprop('prototype').value(),
    this._name,
    this._context,
    this._sharedFunctionInfo,
    this._childHCID,
    this._isStrict
  )

  for (var key in this._attributes) {
    copy._attributes[key] = this._attributes[key]
  }

  return copy
}

proto.call = function FunctionValue_call(cfg, thisValue, args, isNew) {
  // step one: scream for a while, okay
  // step two: electric boogaloo
  var oldScope = cfg._scopeStack.current()
  var oldLast = cfg.last()
  var branchID


  cfg._pushBlockStack()
  cfg._pushBlock(this._code, true, null)
  cfg._connect(cfg.last(), cfg._blockStack.current().enter)
  cfg._scopeStack._current = this._context

  // XXX should we branch?
  // branchID = cfg._branchOpen()

  cfg._scopeStack.push(cfg._blockStack.current())

  if (this._code.id) {
    cfg._scopeStack.newprop(this._code.id.name).assign(this)
  }

  var Arguments = new ObjectValue(
    this._builtins,
    hidden.initial.ARGUMENTS,
    this._builtins.getprop('[[ArgumentsProto]]').value()
  )
  Arguments.newprop('length').assign(new Value(this._builtins, 'number', args.length))

  for(var i = 0, len = this._code.params.length; i < len; ++i) {
    var name = cfg._scopeStack.newprop(this._code.params[i].name)
    name.assign(args[i] || Undefined())

    if (this._isStrict) {
      Arguments.newprop(i).assign(name)
    } else {
      Arguments._attributes[i] = name
    }
  }

  // TODO: arguments.callee = this
  // this.caller = previous stack frame
  var callId = this._sharedFunctionInfo.recordCall(thisValue, Arguments, isNew)
  cfg._callStack.pushFrame(this, thisValue, Arguments, isNew, cfg._blockStack.current())
  cfg._pushFrame(CFG_afterCall, {
    fn: this,
    // branchID: branchID,
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
  // this._branchEnd(context.branchID)
  this._scopeStack._current = context.oldScope

  this._popBlockStack()
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
    var value = values.reduce(function(val, edge) {
      return new Either(val, edge.value)
    }, values.shift())
    this._valueStack.push(value)
  } else {
    this._valueStack.push(Undefined())
  }

  context.fn._sharedFunctionInfo.recordReturn(context.callId, this._valueStack.current())
}

proto.makeNew = function FunctionValue_makeNew() {
  var prototype = this.getprop('prototype').value()
  return new ObjectValue(this._childHCID, prototype)
}

proto.instantiate = function FunctionValue_instantiate(cfg, args) {
  var value = this.makeNew()

  // lazy allocate!
  this._childHCID = this._childHCID === null ? hidden.reserve(this._name) : this._childHCID

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
