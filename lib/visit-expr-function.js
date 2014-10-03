'use strict'

module.exports = install

var FunctionValue = require('./values/function.js')
var hidden = require('./values/hidden-class.js')
var ObjectValue = require('./values/object.js')
var Operation = require('../operation.js')

function install(proto) {
  proto.visitFunctionExpression = visitFunctionExpression
}

function visitFunctionExpression(node) {
  var fnValue
  var fnProto

  fnProto = new ObjectValue(
      this._builtins,
      hidden.initial.EMPTY,
      this._builtins.getprop('[[ObjectProto]]').value()
  )
  fnValue = new FunctionValue(
      this._builtins,
      node,
      fnProto,
      node.id ? node.id.name : null,
      this._scopeStack.current(),
      null,
      null
  )

  this._connect(this.last(), new Operation(Operation.kind.CREATE_FUNCTION, null, null, null))
  this._valueStack.push(fnValue)

  return fnValue
}
