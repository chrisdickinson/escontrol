'use strict'

var Unknown = require('./values/unknown.js')

module.exports = install

function install(proto) {
  proto.visitNewExpression = visitNewExpression
}

// node.callee
// node.arguments/
function visitNewExpression(node) {
  this._pushFrame(visitedCallee, {
    node: node,
    context: null,
    callee: null,
    index: 0
  }, true)

  if (node.loc.start.line == 242 && node.loc.start.column == 33) {
    debugger
  }

  this._visit(node.callee)
}

function visitedCallee(context) {
  var name = this._valueStack.pop()
  var value = null

  if (name.getCurrentSourceObject) {
    value = name.value()

    if (value === null) {
      name.assign(new Unknown(this._builtins))
      value = name.value()
    }
  } else {
    value = name
  }

  context.callee = value
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
  var args = []

  this._connect(this.last(), {operation: 'new'})

  while (pending--) {
    args.unshift(this._valueStack.pop())
  }

  if (context.callee.isUnknown()) {
    if (!context.callee.isFunction()) {
      this._throwException('TypeError')
    }
    context.callee.assumeFunction()
  } else if (!context.callee.isFunction()) {
    this._throwException('TypeError')
    this._connect(this.last(), this._createUnreachable())
  }

  if (context.callee.isFunction()) {
    context.callee.instantiate(this, args)
  } else {
    this._valueStack.push(new Unknown())
  }
}
