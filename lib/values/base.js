'use strict'
module.exports = BaseValue

const toCFG = new WeakMap()

function BaseValue(cfg) {
  toCFG.set(this, cfg)
  this._cfg = cfg
  this._references = new Set()
  this._marks = null
}

var proto = BaseValue.prototype

Object.defineProperty(proto, 'cfg', {
  get: function() {
    return toCFG.get(this)
  },
  enumerable: false
})

proto.isEither = function() {
  return false
}

proto.getprop = function BaseValue_getprop() {
  throw new Error('not implemented')
}

proto.newprop = function BaseValue_newprop() {
  throw new Error('not implemented')
}

proto.delprop = function BaseValue_delprop() {
  // throw new Error('not implemented')
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
  this._references.add(name)
}

proto.removeRef = function(name) {
  this._references.delete(name)
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
