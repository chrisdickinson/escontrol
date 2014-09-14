module.exports = Value

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

proto.toValue = function() {
  return this
}
