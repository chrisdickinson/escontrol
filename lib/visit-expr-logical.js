module.exports = install

function install(proto) {
  proto.visitLogicalExpression = visitLogicalExpression
}

function visitLogicalExpression(node) {
  this._pushBlock(node)
  this._pushFrame(visitedLHS, node)
  this._visit(node.left)
}

function visitedLHS(node) {
  var last = this.last()
  node.operator === '&&' ?
    this._setIfFalse() :
    this._setIfTrue()

  this._connect(last, this._blockStack.current().exit)
  this._setLastNode(last)

  node.operator === '&&' ?
    this._setIfTrue() :
    this._setIfFalse()
  this._pushFrame(visitedRHS, node)
  this._visit(node.right)
}

function visitedRHS(node) {
  this._connect(this.last(), this._popBlock().exit)
}
