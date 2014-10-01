'use strict'

module.exports = Name

function Name(str) {
  this._name = str
  this._currentSource = null
  this._value = null
  this._assignCount = -1
}

var proto = Name.prototype

proto.setCurrentSourceObject = function(current) {
  this._currentSource = current
}

proto.getCurrentSourceObject = function() {
  return this._currentSource
}

proto.assign = function(value) {
  value = value.unwrap ? value.unwrap() : value

  if (this._value) {
    this._value.removeRef(this)
  }

  this._value = value
  this._value.addRef(this)
  ++this._assignCount
}

proto.value = function() {
  return this._value
}
