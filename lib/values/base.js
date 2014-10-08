'use strict'
module.exports = BaseValue
function BaseValue(builtins) {
  this._builtins = builtins
  this._references = []
  this._marks = null
}

var proto = BaseValue.prototype

proto.getprop = function BaseValue_getprop() {
  throw new Error('not implemented')
}

proto.newprop = function BaseValue_newprop() {
  throw new Error('not implemented')
}

proto.delprop = function BaseValue_delprop() {
  throw new Error('not implemented')
}

proto.copy = function BaseValue_copy() {
  throw new Error('not implemented')
}

proto.classInfo = function() {
  return '<BaseValue>'
}

proto.toValue = function() {
  return this
}

proto.toObject = function() {
  return this
}

proto.addRef = function(name) {
  this._references.push(name)
}

proto.removeRef = function(name) {
  var idx = this._references.indexOf(name)
  this._references.splice(idx, 1)
}

proto.getHCID = function() {
  return [this._hcid]
}

proto.setMark = function(key, value) {
  if (!this._marks) {
    this._marks = {__proto__: null}
  }
  this._marks[key] = value
}

proto.getMark = function(key) {
  return this._marks ? [this._marks[key]] : []
}

proto.isNull =
proto.isUndefined =
proto.isObject = 
proto.isFunction = 
proto.isUnknown = 
proto.isValue = function() {
  return false
}
