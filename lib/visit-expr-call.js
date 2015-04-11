'use strict'

var Unknown = require('./values/unknown.js')
var Operation = require('../operation.js')
var unwrap = require('./unwrap-all.js')

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
    args: null,
    recurses: false,
    index: 0
  }, false, true)
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
      name.assign(this.makeUnknown())
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

  this._connect(this.last(), new Operation(Operation.kind.CALL, pending, null, null))

  while (pending--) {
    args.unshift(this._valueStack.pop())
  }

  if (context.callee.isUnknown()) {
    this._throwException('TypeError')
    context.callee.assumeFunction()
  } else if (!context.callee.isFunction()) {
    this._throwException('TypeError')
    this._connect(this.last(), this._createUnreachable())
  }

  var recurses = this._callStack.isRecursion(context.callee)

  if (recurses) {
    var last = this.last()
    this._setBackedge()
    this._connect(last, this._rootBlock().enter)
    this._setLastNode(last)
  }

  var shouldCall = false !== this.oncall(
    unwrap(context.callee),
    context.context,
    args.map(unwrap),
    recurses
  )
  context.args = args
  context.recurses = recurses
  context.numValues = this._valueStack._values.length
  this._pushFrame(oncalled, context)
  if ((!context.callee.isUnknown() || context.callee.isEither()) &&
      context.callee.isFunction() &&
      !recurses &&
      shouldCall) {
    this._valueStack.fence()
    context.callee.call(this, context.context, args)
  } else {
    this._valueStack.push(this.makeUnknown())
  }
}

function oncalled(context) {
  this._valueStack.unfence()
  if (this._valueStack._values.length === context.numValues) {
    throw new Error('function ' + context.callee._name + ' did not push a value.')
  }
  this.oncalled(unwrap(context.callee), context.context, context.args.map(unwrap), context.recurses, this._valueStack.current())
}
