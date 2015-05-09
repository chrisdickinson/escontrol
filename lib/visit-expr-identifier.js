'use strict'

module.exports = install

var Operation = require('../operation.js')
var unwrap = require('./unwrap-all.js')

function install(proto) {
  proto.visitIdentifier = visitIdentifier
}

function visitIdentifier(node) {
  var name = this._scopeStack.getprop(node.name)

  if (node.name === 'arguments' && !name) {
    this._connect(this.last(), new Operation(Operation.kind.LOAD_NAME, node.name, null, null))

    if (this._isLValue()) {
      this._valueStack.push(this._scopeStack.current().newprop('arguments'))
      return
    }

    this._valueStack.push(this._callStack.current().getArguments())
    return
  }

  if (node.name === 'undefined' && !name) {
    this._connect(this.last(), new Operation(Operation.kind.LOAD_NAME, node.name, null, null))

    if (this._isLValue()) {
      this._valueStack.push(this._scopeStack.current().newprop('undefined'))
      return
    }

    this._valueStack.push(this.makeUndefined())
    return
  }

  if (this._isLValue()) {
    var createdName = false
    if (!name) {
      createdName = true
      name = this._scopeStack.root().newprop(node.name)
    }

    this._valueStack.push(name)
    this._connect(this.last(), new Operation(
      Operation.kind.LOAD_NAME, node.name, createdName, null))
    return
  }

  var needException = false
  var value

  if (name === null) {
    needException = true
    value = this.makeUnknown()
  } else {
    value = name.value()
  }

  // if the value has been declared but not
  // assigned yet, it's undefined.
  if (value === null) {
    value = this.makeUndefined()
    name.assign(value)
  }

  this.onload(name, unwrap(value), node)

  this._connect(this.last(), new Operation(Operation.kind.LOAD_VALUE, node.name, null, null))
  this._valueStack.push(value)
  if (needException) {
    this._throwException('ReferenceError', node.name)

    // it's an unknown global
    this._scopeStack.newprop(node.name, 'imaginary').assign(value)
  }
}
