'use strict'

module.exports = install

function install(proto) {
  proto.visitSequenceExpression = visitSequenceExpression
}

function visitSequenceExpression(node) {
  this._pushFrame(iterateSequenceExpression, {
    node: node,
    index: 0
  })
}

function iterateSequenceExpression(context) {
  if (context.index === context.node.expressions.length) {
    return
  }

  this._pushFrame(iterateSequenceExpressionPost, context)
  this._visit(context.node.expressions[context.index++])
}

function iterateSequenceExpressionPost(context) {
  if (context.index !== context.node.expressions.length) {
    this._connect(this.last(), this._popValue())
  }
  this._pushFrame(iterateSequenceExpression, context)
}
