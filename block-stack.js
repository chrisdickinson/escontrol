module.exports = BlockStack

function BlockStack() {
  if (!(this instanceof BlockStack)) {
    return new BlockStack()
  }
  this._block = null
}

var cons = BlockStack
var proto = cons.prototype

proto.current = function () {
  return this._block
}

proto.pushState = function (node, labels, hasException) {
  this._block = new Block(this._block, node, labels, hasException ? {
    type: 'exception'
  } : null)
}

proto.pop = function () {
  var last = this._block

  this._block = this._block.parent()

  return last
}

function Block(parent, astNode, labels, exc) {
  this.type = astNode.type
  this._parent = parent
  this.labels = labels.slice()

  this.enter = {type: 'enter ' + astNode.type}
  this.exit = {type: 'exit ' + astNode.type}
  this.exception = exc || null
}

var cons = Block
var proto = cons.prototype

proto.parent = function() {
  return this._parent
}
