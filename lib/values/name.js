'use strict'

module.exports = Name

const toCFG = new WeakMap
const toSource = new WeakMap

function Name(str, source, cfg) {
  toCFG.set(this, cfg)
  toSource.set(this, source)
  this._name = str
  this._currentSource = null
  this._value = null
  this._assignCount = -1
}

var proto = Name.prototype

Object.defineProperty(proto, 'cfg', {
  get() {
    return toCFG.get(this)
  },
  enumerable: false
})

Object.defineProperty(proto, 'source', {
  get() {
    return toSource.get(this)
  },
  enumerable: false
})

proto.setCurrentSourceObject = function(current) {
  this._currentSource = current
}

proto.getCurrentSourceObject = function() {
  return this._currentSource
}

proto.assign = function(value) {
  if (this._value) {
    this._value.removeRef(this)
  }
  this._value = value
  if (this._value) {
    this._value.addRef(this)
  }
  ++this._assignCount
}

proto.value = function() {
  return this._value
}

proto.getName = function() {
  return this._name
}
