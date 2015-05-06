'use strict'
module.exports = BaseValue

const unwrap = require('../unwrap-all.js')

const toRefs = new WeakMap()
const toCFG = new WeakMap()

function BaseValue(cfg) {
  toCFG.set(this, cfg)
  toRefs.set(this, new Set())
  this._marks = null
  if (cfg) {
    cfg.onvalue(this)
  }
}

var proto = BaseValue.prototype

Object.defineProperty(proto, 'cfg', {
  get: function() {
    return toCFG.get(this)
  },
  enumerable: false
})

Object.defineProperty(proto, '_references', {
  get: function() {
    return toRefs.get(this)
  },
  enumerable: false
})

proto.names = function*() {
}

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
  if (this.cfg) {
    this.cfg.onlink(unwrap(name.source), unwrap(this), name.getName())
  }
}

proto.removeRef = function(name) {
  this._references.delete(name)
  if (this.cfg) {
    this.cfg.onunlink(unwrap(name.source), unwrap(this), name.getName())
  }
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
