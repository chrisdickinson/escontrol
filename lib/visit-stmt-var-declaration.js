'use strict'

var Operation = require('../operation.js')

module.exports = install

function install(proto) {
  proto.visitVariableDeclaration = visitVariableDeclaration
}

function visitVariableDeclaration(node) {
  this._pushFrame(iterateVariableDeclaration, {
    node: node,
    index: 0,
  })
}

function iterateVariableDeclaration(context) {
  var max = context.node.declarations.length

  if (max === context.index) {
    return
  }

  while (context.index !== max && !context.node.declarations[context.index].init) {
    ++context.index
  }

  if (max === context.index) {
    return
  }

  if (context.node.kind === 'let') {
    this._scopeStack.newprop(context.node.declarations[context.index].id.name, 'let')
  }

  this._pushFrame(visitedIdent, context, true)
  context.asName = context.node.declarations[context.index].id.name
  this._visit(context.node.declarations[context.index].id)
}

function visitedIdent(context) {
  this._pushFrame(visitedInit, context)
  this._visit(context.node.declarations[context.index++].init)
}

function visitedInit(context) {
  var rhs = this._valueStack.pop()
  var lhs = this._valueStack.pop()

  lhs.assign(rhs)

  this._connect(this.last(), new Operation(Operation.kind.STORE_VALUE, context.asName, null, null))
  this._pushFrame(iterateVariableDeclaration, context)
}
