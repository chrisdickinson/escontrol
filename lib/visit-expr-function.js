'use strict'

module.exports = install

var ObjectValue = require('./object.js')
var typeOf = require('./types.js')

function install(proto) {
  proto.visitFunctionExpression = visitFunctionExpression
}

function visitFunctionExpression(node) {
  var context = {lastNode: null, branchID: 0, value: null}
  var lastNode
  var branchID
  var fnValue
  var fnProto
  var code

  lastNode = this.last()
  this._pushBlockStack()

  code = {}
  fnValue = new ObjectValue(
    typeOf.FUNCTION | typeOf.STATIC,
    ObjectValue.HCI_FUNCTION,
    null, // TODO: builtin prototypes
    code
  )

  fnProto = new ObjectValue(
    typeOf.FUNCTION | typeOf.STATIC,
    ObjectValue.HCI_EMPTY,
    null, // TODO: builtin prototypes
    code
  )

  fnProto.declare('constructor').assign(fnValue)
  fnValue.declare('prototype').assign(fnProto)

  context.lastNode = lastNode
  context.value = fnValue
  this._pushBlock(node, true, null)
  context.branchID = this._branchOpen()
  this._scopeStack.push(this._blockStack.current())

  if (node.id) {
    this._scopeStack.declare(node.id.name).assign(fnValue)
  }

  for (var i = 0, len = node.params.length; i < len; ++i) {
    this._scopeStack
      .declare(node.params[i].name)
      .assign(ObjectValue.createUnknown())
  }

  this._setLastNode(this._blockStack.current().enter)

  this._pushFrame(visitedBody, context)
  this._visit(node.body)
  this._hoist(node)

  // return fnValue -- `CFG#_hoist` will make use of it.
  return fnValue
}

function visitedBody(context) {
  this._scopeStack.pop()
  this._branchEnd(context.branchID)
  var block = this._popBlock()
  this._popBlockStack()
  this._setLastNode(context.lastNode)
  this._connect(this.last(), {operation: 'function'})
  this._pushValue(context.value)
}

