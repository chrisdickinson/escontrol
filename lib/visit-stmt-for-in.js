'use strict'

module.exports = install

var Operation = require('../operation.js')

function install(proto) {
  proto.visitForInStatement = visitForInStatement
}

function visitForInStatement(node) {
  if (node.left.type !== 'Identifier' && node.left.type !== 'VariableDeclaration') {
    // TODO: visit right, then throw an error

    return
  }

  this._pushBlock(node)
  this._pushFrame(visitedLeft, node, true)
  this._visit(node.left)
}

function visitedLeft(node) {
  this._pushFrame(visitedRight, node)
  this._visit(node.right)
}

function visitedRight(node) {
  var iter = new Operation(Operation.kind.NEXT_KEY, null, null, null)
  this._connect(this.last(), new Operation(Operation.kind.ENUMERATE, null, null, null))
  this._connect(this.last(), iter)
  var obj = this._valueStack.pop()

  if (node.left.type === 'Identifier') {
    this._valueStack.pop()
  }

  this._setIfFalse()
  this._connect(this.last(), this._currentBlock().exit)
  this._setLastNode(iter)

  var attemptedName = node.left.name || node.left.declarations[0].id.name
  var lhs = this._scopeStack.getprop(attemptedName)

  if (lhs === null) {
    if (this._isStrict()) {
      this._throwException(
        'ReferenceError',
        attemptedName
      )
      this._setLastNode(this._createUnreachable())
    }
    lhs = this._scopeStack.newprop(attemptedName, 'imaginary')
  }

  var val = this.makeValue('string')
  lhs.assign(val)
  this._setIfTrue()
  this._pushFrame(visitedBody, {
    iter: iter,
    branchID: this._branchOpen()
  })
  this._visit(node.body)
}

function visitedBody(context) {
  this._branchEnd(context.branchID)
  this._setBackedge()
  this._connect(this.last(), context.iter)
  this._setLastNode(this._popBlock().exit)
}
