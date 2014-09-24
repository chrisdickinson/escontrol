'use strict'

module.exports = WrappedName

var WrappedObject = require('./wrapped-object.js')
var Either = require('./either.js')
var typeOf = require('./types.js')

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

proto.value = function() {
  var out = this._value || new WrappedObject(this._wrapped.value(), this.branchNumber)

  return out
}

