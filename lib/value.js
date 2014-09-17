'use strict'

module.exports = Value

var ObjectValue = require('./object.js')

function Value(type, value) {
  this._type = type
  this._value = value
}

var proto = Value.prototype

proto.lookup = function Value_lookup(prop, immediate) {
  return this.toObject().lookup(prop, immediate)
}

proto.declare = function Value_declare(prop) {
  return this.toObject().declare(prop)
}

proto.del = function Value_del(prop) {
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
