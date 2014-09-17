'use strict'

module.exports = install

function install(proto) {
  proto.visitExpressionStatement = visitExpressionStatement
}

function visitExpressionStatement(node) {
  this._pushFrame(afterExpression, node)
  this._visit(node.expression)
}

function afterExpression(node) {
  this._connect(this.last(), this._popValue())
}
