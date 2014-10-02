'use strict'

var Unknown = require('./values/unknown.js')

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
  var name = this._valueStack.pop()
  var target = null
  var value = null

  if (name.getCurrentSourceObject) {
    target = name.getCurrentSourceObject()
    value = name.value()
    target = target === this._scopeStack.current() ? this._scopeStack.root() : target

    if (value === null) {
      name.assign(new Unknown(this._builtins))
      value = name.value()
    }

    if (target === null) {
      throw new Error('should always have a target')
    }
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
  var args = []

  this._connect(this.last(), {operation: 'call'})

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

  var recurses = this._callStack.isRecursion(context.callee)

  if (recurses) {
    var last = this.last()
    this._connect(last, this._blockStack.root().enter)
    this._setLastNode(last)
  }

  if (context.callee.isFunction() && !recurses) {
    context.callee.call(this, context.context, args)
  } else {
    this._valueStack.push(new Unknown())
  }
}
