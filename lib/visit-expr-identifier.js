'use strict'

module.exports = install

var Unknown = require('./values/unknown.js')

function install(proto) {
  proto.visitIdentifier = visitIdentifier
}

function visitIdentifier(node) {
  var name = this._scopeStack.getprop(node.name)

  if (this._isLValue()) {
    if (!name) {
      name = this._scopeStack.root().newprop(node.name)
    }

    this._valueStack.push(name)
    this._connect(this.last(), {operation: 'ident', name: node.name})
    return
  }

  var needException = false
  var value

  if (name === null) {
    needException = true
    value = new Unknown(this._builtins)
  } else {
    value = name.value()
  }

  // wait what?
  if (value === null) {
    value = new Unknown(this._builtins)
    name.assign(value)
  }

  this._connect(this.last(), {operation: 'load', name: node.name})
  this._valueStack.push(value)
  if (needException) {
    this._throwException('ReferenceError', node.name)

    // it's an unknown global
    this._scopeStack.newprop(node.name, 'imaginary').assign(value)
  }
}
