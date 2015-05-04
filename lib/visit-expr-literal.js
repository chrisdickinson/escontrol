'use strict'

module.exports = install

var hidden = require('./values/hidden-class.js')
var Operation = require('../operation.js')

function install(proto) {
  proto.visitLiteral = visitLiteral
}

function visitLiteral(node) {
  var value

  if (node.value instanceof RegExp) {
    value = this.makeRegExp(node.value, node.flags)
  } else if (node.value === null) {
    value = this.makeNull()
  } else if (node.value === undefined) {
    value = this.makeUndefined()
  } else {
    value = this.makeValue(typeof node.value, node.value)
  }

  this._valueStack.push(value)
  this._connect(this.last(), new Operation(
    Operation.kind.LOAD_LITERAL,
    node.value,
    null,
    null
  ))
}
