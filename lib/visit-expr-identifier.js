module.exports = install

var typeOf = require('./types.js')
var ObjectValue = require('./object.js')

function install(proto) {
  proto.visitIdentifier = visitIdentifier
}

function visitIdentifier(node) {
  var name = this._scopeStack.lookup(node.name)
  var needException = false
  var value

  if (name === null) {
    needException = true
    value = new ObjectValue(typeOf.ANY)
  } else {
    value = name.value()
  }

  this._pushValue(value, false, node.name)

  if (needException) {
    this._throwException('ReferenceError', node.name)
    this._scopeStack.declare(node.name, 'imaginary')
    this._scopeStack.lookup(node.name).assign(value)
  }
}
