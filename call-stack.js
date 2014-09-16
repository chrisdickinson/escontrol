module.exports = CallStack

function CallStack() {
  if (!(this instanceof CallStack)) {
    return new CallStack()
  }

  this._current = null
}

var proto = CallStack.prototype

proto.pushFrame = function(thisValue, args, isNew, block) {
  this._current = new Frame(thisValue, args, isNew, block, this._current)
}

proto.popFrame = function() {
  this._current = this._current.parent
}

function Frame(thisValue, args, isNew, parent, fromBlock) {
  this._thisValue = thisValue
  this._args = args
  this._isNew = isNew
  this._fromBlock = fromBlock
  this.parent = parent
}
