module.exports = install

var typeOf = require('./types.js')

function install(proto) {
  proto.visitIdentifier = visitIdentifier
}

function visitIdentifier(node) {
  var value = this._scopeStack.lookup(node.name)
  var needException = false

  if (value === null) {
    needException = true
    value = {
      type: typeOf.ANY,
      staticValue: null
    }
  }

  this._pushValue(value, false, node.name)

  if (needException) {
    this._throwException('ReferenceError', node.name)
    this._assumeDefined(node.name)
  }
}
