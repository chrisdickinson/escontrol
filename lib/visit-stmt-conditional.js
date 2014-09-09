module.exports = install

function install(proto) {
  proto.visitIfStatement = visitIfStatement
}

function visitIfStatement(node) {
  this._pushBlock(node)
  this._pushFrame(visitedTest, {
    node: node,
    consequentNode: null,
    testNode: null
  })
  this._visit(node.test)
}

function visitedTest(context) {
  this._connect(this.last(), this._popValue())
  context.testNode = this.last()

  this._setIfTrue()
  this._pushFrame(visitedConsequent, context)
  this._visit(context.node.consequent)
}

function visitedConsequent(context) {
  context.consequentNode = this.last()

  if (context.node.alternate) {
    this._setIfFalse()
    this._setLastNode(context.testNode)
    this._pushFrame(visitedAlternate, context)
    return this._visit(context.node.alternate)
  }

  var block = this._popBlock()

  this._connect(context.consequentNode, block.exit)
  this._setIfFalse()
  this._connect(context.testNode, block.exit)
}

function visitedAlternate(context) {
  var block = this._popBlock()

  this._connect(this.last(), block.exit)
  this._connect(context.consequentNode, block.exit)
}
