'use strict'

module.exports = install

function install(proto) {
  proto.visitThisExpression = visitThisExpression
}

function visitThisExpression() {
  this._connect(this.last(), {'operation': 'load-value', 'name': 'this'})
  this._valueStack.push(this._currentCallFrame().getThis())
}
