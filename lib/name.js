module.exports = Name

var typeOf = require('./types.js')

function Name(str) {
  this._name = str
  this._value = null
}

var proto = Name.prototype

proto.assign = function(value) {
  this._value = value
}
