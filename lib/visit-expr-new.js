'use strict'

var ObjectValue = require('./values/object.js')
var Unknown = require('./values/unknown.js')
var Operation = require('../operation.js')

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

  this._connect(this.last(), new Operation(Operation.kind.NEW, null, null, null))

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
    this._setBackedge()
    this._connect(last, this._blockStack.root().enter)
    this._setLastNode(last)
  }

  if (!context.callee.isUnknown() && context.callee.isFunction() && !recurses) {
    context.callee.instantiate(this, args)
  } else {
    var val = new Unknown(this._builtins)
    val.assumeDefined()
    this._valueStack.push(val)
  }
}
