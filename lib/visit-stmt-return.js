'use strict'

module.exports = install

var FUNCTIONS = {
    'FunctionDeclaration': true
  , 'FunctionExpression': true
  , 'ArrowExpression': true
  , 'Program': true             // shh, shh, node. it's ok.
}

function install(proto) {
  proto.visitReturnStatement = visitReturnStatement
}

function visitReturnStatement(node) {
  if (node.argument) {
    this._pushFrame(visitedArgument, node)
    this._visit(node.argument)

    return
  }

  visitedArgument.call(this, node)
}

function visitedArgument(node) {
  var current = this._currentBlock()

  while (current) {
    if (FUNCTIONS[current.type]) {
      break
    }

    current = current.parent()
  }

  if (!current) {
    throw new Error('ran out of blocks!')
  }

  this._connect(this.last(), current.exit, node.argument)
  if (node.argument) {
    this._valueStack.pop()
  }
  this._setLastNode(this._createUnreachable())
}
