'use strict'

module.exports = WrappedName

var WrappedValue = require('./value-wrapped.js')
var Either = require('./either.js')

function WrappedName(name, branchNo) {
  this._wrapped = name
  this._value = null
  this.branchNumber = branchNo
}

var proto = WrappedName.prototype

proto.setCurrentSourceObject = function(current) {
  this._wrapped.setCurrentSourceObject(current)
}

proto.getCurrentSourceObject = function() {
  return this._wrapped.getCurrentSourceObject()
}

proto.assign = function(value) {
  // the parent object now points at
  // an Any(oldValue, newValue) value
  value = value.unwrap ? value.unwrap() : value

  var name = this._wrapped

  while (name.branchNumber) {
    if (name._value) {
      break
    }

    name = name._wrapped
  }

  name.assign(new Either(this._wrapped.value(), value))
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

  return new WrappedValue(val, this.branchNumber)

  var out = this._value || new WrappedValue(this._wrapped.value(), this.branchNumber)

  return out
}
