module.exports = install

function install(proto) {
  proto.visitProgram = visitProgram
}

function visitProgram(node) {
  this._pushBlock(node)
  // hoist all definitions
  this._hoist(node)
  this._pushFrame(iterateProgram, {
    node: node,
    index: 0
  })
}

function iterateProgram(context) {
  if (context.index === context.node.body.length) {
    return this._connect(this.last(), this._popBlock().exit)
  }

  context.oldLast = this.last()
  this._pushFrame(iterateProgramPostVisit, context)
  this._visit(context.node.body[context.index++])
}

function iterateProgramPostVisit(context) {
  //this._connect(context.oldLast, this.last())
  this._pushFrame(iterateProgram, context)
}
