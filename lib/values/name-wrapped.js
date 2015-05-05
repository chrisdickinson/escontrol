'use strict'

module.exports = WrappedName

var WrappedValue = require('./value-wrapped.js')
var Either = require('./either.js')

const toCFG = new WeakMap()

function WrappedName(cfg, name, branchValues) {
  this._wrapped = name
  this._value = null
  this.branchValues = branchValues
  toCFG.set(this, cfg)
}

var proto = WrappedName.prototype

Object.defineProperty(proto, 'cfg', {
  get() {
    return toCFG.get(this)
  },
  enumerable: false
})

proto.setCurrentSourceObject = function(current) {
  this._wrapped.setCurrentSourceObject(current)
}

proto.getCurrentSourceObject = function() {
  return this._wrapped.getCurrentSourceObject()
}

proto.assign = function(value) {
  // the parent object now points at
  // an Any(oldValue, newValue) value
  var name = this._wrapped

  while (name.branchValues) {
    if (!(name instanceof WrappedName)) {
      break
    }

    name = name._wrapped
  }

  name.assign(Either.of(this._wrapped.value(), value))
  this._value = value
}

proto.getName = function() {
  return this._wrapped.getName()
}

proto.value = function() {
  if (this._value) {
    return this._value
  }

  var val = this._wrapped.value()
  if (val === null) {
    return null
  }

  return new WrappedValue(this.cfg, val, this.branchValues)
}
