module.exports = install

function install(proto) {
  proto.visitDoWhileStatement = visitDoWhileStatement
}

function visitDoWhileStatement(node) {
  this._pushBlock(node)
  this._pushFrame(visitedBody, node)
  this._visit(node.body)
}

function visitedBody(node) {
  this._pushFrame(visitedTest, node)
  this._visit(node.test)
}

function visitedTest(node) {
  this._connect(this.last(), this._popValue())
  var last = this.last()

  this._setIfFalse()
  this._connect(this.last(), this._blockStack.current().exit)

  this._setIfTrue()
  this._connect(last, this._blockStack.current().enter)
  this._setLastNode(this._popBlock().exit)
}

