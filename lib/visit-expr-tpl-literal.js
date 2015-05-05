'use strict'

var Operation = require('../operation.js')
var unwrap = require('./unwrap-all.js')

module.exports = install

function install(proto) {
  proto.visitTemplateLiteral = visitTemplateLiteral
  proto.visitTemplateElement = visitTemplateElement
  proto.visitTaggedTemplateLiteral = visitTaggedTemplateLiteral
}

function visitTemplateElement(node) {
  this._valueStack.push(this.makeValue('string', node.cooked))
}

function visitTemplateLiteral(node) {
  this._pushFrame(iterateQuasis, {
    node: node,
    strings: [],
    args: [],
    exec: toString,
    index: 0
  })
}

function visitTaggedTemplateLiteral(node) {
  this._pushFrame(visitedTag, {
    node: node.quasi,
    strings: [],
    args: [],
    exec: callTag,
    callee: null,
    context: null,
    index: 0
  }, false, true)
  this._visit(node.tag)
}

function visitedTag(context) {
  var name = this._valueStack.pop()
  var target = null
  var value = null

  if (name.getCurrentSourceObject) {
    target = name.getCurrentSourceObject()
    value = name.value()
    target = target === this._scopeStack.current() ? this._scopeStack.root() : target

    if (value === null) {
      value = this.makeUnknown()
      name.assign(value)
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
  this._pushFrame(iterateQuasis, context)
}

// quasis + expressions
function iterateQuasis(context) {
  if (context.index === context.node.quasis.length) {
    if (!context.node.expressions) {
      return context.exec(this, context)
    }
    context.index = 0
    return this._pushFrame(iterateExprs, context)
  }

  this._pushFrame(visitedElement, context)
  this._visit(context.node.quasis[context.index++])
}

function iterateExprs(context) {
  if (context.index === context.node.expressions.length) {
    return context.exec(this, context)
  }

  this._pushFrame(visitedExpr, context)
  this._visit(context.node.expressions[context.index++])
}

function visitedElement(context) {
  context.strings.push(this._valueStack.pop())
  this._pushFrame(iterateQuasis, context)
}

function visitedExpr(context) {
  context.args.push(this._valueStack.pop())
  this._pushFrame(iterateExprs, context)
}

function toString(cfg, context) {
  cfg._valueStack.push(cfg.makeValue('string'))
  cfg._connect(cfg.last(), new Operation(
    Operation.kind.LOAD_LITERAL_TEMPLATE,
    context.args.length,
    context.strings,
    null
  ))
}

function callTag(cfg, context) {
  cfg._connect(
    cfg.last(),
    new Operation(Operation.kind.CALL, context.args.length + 1, null, null)
  )

  const args = context.args
  const stringsArray = cfg._builtins.getprop('[[ArrayConstructor]]').value().makeNew()

  stringsArray
    .newprop('length')
    .assign(cfg.makeValue('number', context.strings.length))

  for (var i = 0; i < context.strings.length; ++i) {
    stringsArray.newprop(i).assign(context.strings[i])
  }

  if (context.callee.isUnknown()) {
    cfg._throwException('TypeError')
    context.callee.assumeFunction()
  } else if (!context.callee.isFunction()) {
    cfg._throwException('TypeError')
    cfg._connect(cfg.last(), cfg._createUnreachable())
  }

  var recurses = cfg._callStack.isRecursion(context.callee)

  // XXX: cfg should recurse to the correct function block enter, check cfg!
  if (recurses) {
    var last = cfg.last()
    cfg._setBackedge()
    cfg._connect(last, recurses.enter ? recurses.enter : cfg._rootBlock().enter)
    cfg._setLastNode(last)
  }
  
  var shouldCall = false !== cfg.oncall(
    unwrap(context.callee),
    context.context,
    args.map(unwrap),
    recurses
  )
  context.args = args
  context.recurses = recurses
  context.numValues = cfg._valueStack._values.length
  cfg._pushFrame(oncalled, context)
  if ((!context.callee.isUnknown() || context.callee.isEither()) &&
      context.callee.isFunction() &&
      !recurses &&
      shouldCall) {
    cfg._valueStack.fence()
    context.callee.call(cfg, context.context, args)
  } else {
    cfg._valueStack.push(cfg.makeUnknown())
  }
}

function oncalled(context) {
  this._valueStack.unfence()
  if (this._valueStack._values.length === context.numValues) {
    throw new Error('function ' + context.callee._name + ' did not push a value.')
  }
  this.oncalled(unwrap(context.callee), context.context, context.args.map(unwrap), context.recurses, this._valueStack.current())
}
