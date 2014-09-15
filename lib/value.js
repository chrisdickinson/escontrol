module.exports = Value

var ObjectValue = require('./object.js')

function Value(type, value) {
  this._type = type
  this._value = value
}

var proto = Value.prototype

proto.getattr = function Value_getattr(prop) {
}

proto.setattr = function Value_setattr(prop, value) {
}

proto.delattr = function Value_delattr(prop) {
}

proto.val = function() {
  return this._value
}

proto.andTypes = function(types) {
  this._types &= types & 0xFF
}

proto.type = function() {
  return this._type
}

proto.toValue = function() {
  return this
}

proto.toObject = function() {
  return new ObjectValue(this._type, ObjectValue.HCI_EMPTY)
}
