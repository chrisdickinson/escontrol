module.exports = CallStack

var createBlockStack = require('./block-stack.js')
var unwrap = require('./lib/unwrap-all.js')

function CallStack() {
  if (!(this instanceof CallStack)) {
    return new CallStack()
  }

  this._current = null
}

var proto = CallStack.prototype

proto.pushFrame = function(func, thisValue, args, isNew, block) {
  this._current = new Frame(unwrap(func), thisValue, args, isNew, block, this._current)
}

proto.popFrame = function() {
  this._current = this._current.parent
}

proto.current = function() {
  return this._current
}

proto.info = function() {
  var out = []
  var current = this._current
  while(current && current._func) {
    out.push(current._func._name)
    current = current.parent
  }
  return out.join('/')
}

proto.isRecursion = function(fn) {
  var current = this._current
  fn = unwrap(fn)

  while(current && current._func) {
    if (current._func._code === fn._code) {
       return current._fromBlock || true
    }
    current = current.parent
  }

  return false
}

function Frame(func, thisValue, args, isNew, fromBlock, parent) {
  this._func = func
  this._thisValue = thisValue
  this._args = args
  this._isNew = isNew
  this._fromBlock = fromBlock
  this._stack = createBlockStack()

  this.parent = parent
}

var proto = Frame.prototype

proto.getThis = function() {
  return this._thisValue
}

proto.getArguments = function() {
  return this._args
}

proto.getStack = function() {
  return this._stack
}

proto.getFunction = function() {
  return this._func
}
