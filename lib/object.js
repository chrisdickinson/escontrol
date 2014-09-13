module.exports = Object

function Object(type, value, code) {
  this._type = type
  this._value = value
  this._code = code
  this._hiddenClassID = 0
  this._attributeOperations = []
  this._attrCache = {}
}

var proto = Object.prototype

proto.getattr = function Object_getattr(prop) {
  if (this._attrCache[prop]) {
    return this._attrCache[prop]
  }

  // otherwise, run through the operations
  var value = null
  for (var i = 0, len = this._attributeOperations.length; i < len; ++i) {
    if (this._attributeOperations[i].attr !== prop) continue

    value = this._attributeOperations[i].value
  }

  return this._attrCache[prop] = value
}

proto.setattr = function Object_setattr(prop, value) {
  delete this._attrCache[prop]

  this._attributeOperations.push({
    attr: prop,
    value: value
  })
}

proto.delattr = function Object_delattr(prop) {
  delete this._attrCache[prop]

  this._attributeOperations.push({
    attr: prop,
    value: null
  })
}
