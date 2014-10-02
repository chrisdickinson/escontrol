'use strict'

module.exports = install

var Value = require('./values/value.js')

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
  var iter = {'operation': 'next-key'}
  this._connect(this.last(), iter)
  var obj = this._valueStack.pop()

  if (node.left.type === 'Identifier') {
    this._valueStack.pop()
  }

  this._setIfFalse()
  this._connect(this.last(), this._blockStack.current().exit)
  this._setLastNode(iter)

  var lhs = this._scopeStack.getprop(
    node.left.name || node.left.declarations[0].id.name
  )
  var val = new Value(this._builtins, 'string')
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
  this._connect(this.last(), context.iter)
  this._setLastNode(this._popBlock().exit)
}
