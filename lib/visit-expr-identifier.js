module.exports = install

var typeOf = require('./types.js')
var ObjectValue = require('./object.js')

function install(proto) {
  proto.visitIdentifier = visitIdentifier
}

function visitIdentifier(node) {
  var name = this._scopeStack.lookup(node.name)

  if (this._isLValue()) {
    if (!name) {
      name = this._scopeStack.root().declare(node.name)
    }

    this._valueStack._values.push(name)
    this._connect(this.last(), {operation: 'ident', name: node.name})
    return
  }

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
