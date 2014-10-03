module.exports = BlockStack

var Operation = require('./operation.js')

function BlockStack() {
  if (!(this instanceof BlockStack)) {
    return new BlockStack()
  }
  this._block = null
  this._root = null
}

var cons = BlockStack
var proto = cons.prototype

proto.current = function () {
  return this._block
}

proto.root = function() {
  return this._root
}

proto.pushState = function (node, labels, hasException, finalizer) {
  this._block = new Block(this._block, node, labels, hasException ? new Operation(    Operation.kind.EXC, node.type, null, null
  ) : null, finalizer || null)
  this._root = this._root || this._block
}

proto.pop = function () {
  var last = this._block

  this._block = this._block.parent()

  return last
}

function Block(parent, astNode, labels, exc, finalizer) {
  this.type = astNode.type
  this._parent = parent
  this.labels = labels.slice()
  this.finalizer = finalizer || null

  this.enter = new Operation(Operation.kind.ENTER, astNode.type, null, null)
  this.exit = new Operation(Operation.kind.EXIT, astNode.type, null, null)
  this.exception = exc || null
}

var cons = Block
var proto = cons.prototype

proto.parent = function() {
  return this._parent
}
