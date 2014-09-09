module.exports = install

function install(proto) {
  proto.visitBlock = visitBlock
}

function visitBlock(node) {
  this._pushBlock(node)
  this._pushFrame(iterateBlock, {
    node: node,
    index: 0
  })
}

function iterateBlock(context) {
  if (context.index === context.node.body.length) {
    return this._connect(this.last(), this._popBlock().exit)
  }

  context.oldLast = this.last()
  this._pushFrame(iterateBlockPostVisit, context)
  this._visit(context.node.body[context.index++])
}

function iterateBlockPostVisit(context) {
  this._pushFrame(iterateBlock, context)
}
