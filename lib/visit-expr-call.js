'use strict'

var ObjectValue = require('./object.js')

module.exports = install

function install(proto) {
  proto.visitCallExpression = visitCallExpression
}

// node.callee
// node.arguments/
function visitCallExpression(node) {
  this._pushFrame(visitedCallee, {
    node: node,
    context: null,
    callee: null,
    index: 0
  }, true)
  this._visit(node.callee)
}

function visitedCallee(context) {
  var name = this._valueStack.current()
  var target = null
  var value = null

  if (name.getCurrentSourceObject) {
    target = name.getCurrentSourceObject()
    value = name.value()
    target = this._scopeStack.current() ? this._scopeStack.root() : target
  } else {
    target = this._scopeStack.root()
    value = name
  }

  context.callee = value
  context.context = target 
  this._pushFrame(iterateArguments, context)
}

function iterateArguments(context) {
  if (context.index === context.node.arguments.length) {
    return this._pushFrame(visitedArguments, context)
  }

  this._pushFrame(iterateArguments, context)
  this._visit(context.node.arguments[context.index++])
}

function visitedArguments(context) {
  var pending = context.node.arguments.length
  var vals = []

  while (pending--) {
    vals.unshift(this._valueStack.pop())
  }

  this._valueStack.pop()
  this._valueStack._values.push(ObjectValue.createUnknown())
  this._connect(this.last(), {operation: 'call'})
}
