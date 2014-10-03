'use strict'

var Operation = require('../operation.js')

module.exports = install

function install(proto) {
  proto.visitThisExpression = visitThisExpression
}

function visitThisExpression() {
  this._connect(this.last(), new Operation(Operation.kind.LOAD_VALUE, 'this', null, null))
  this._valueStack.push(this._currentCallFrame().getThis())
}
