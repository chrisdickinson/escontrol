module.exports = Name

var typeOf = require('./types.js')

function Name(str) {
  if (!(this instanceof Name)) {
    return new Name(str)
  }
  this._name = str
  this._value = null
}

var proto = Name.prototype

proto.assign = function(value) {
  this._value = value
}

proto.value = function() {
  return this._value
}
