module.exports = install

function install(proto) {
  proto.visitThrowStatement = visitThrowStatement
}

function visitThrowStatement(node) {
  this._pushFrame(visitedArgument, node)
  this._visit(node.argument)
}

function visitedArgument(node) {
  var current = this._blockStack.current()

  while (current) {
    if (current.exception) {
      break
    }

    current = current.parent()
  }

  if (!current) {
    throw new Error('ran out of blocks!')
  }

  this._connect(this.last(), current.exception)
  this._setLastNode(this._createUnreachable())
}

