'use strict'

module.exports = EitherName

var Either = require('./either.js')

function EitherName(from, propName, canThrow, immediate) {
  this._from = from
  this._propName = propName
  this._currentSource = from
  this.canThrow = canThrow
  this._immediate = immediate
}

var proto = EitherName.prototype

Object.defineProperty(proto, 'source', {
  get() {
    return this._from
  },
  enumerable: false
})

proto.getName = function() {
  return this._propName
}

proto.setCurrentSourceObject = function(current) {
  this._currentSource = current
}

proto.getCurrentSourceObject = function() {
  return this._currentSource
}

proto.assign = function(value) {
  for (var item of this._from._outcomes) {
    if (item.isUndefined() || item.isNull()) {
      continue
    }
    var prop = item.getprop(this._propName, true)
    if (!prop) {
      prop = item.newprop(this._propName)
    }
    prop.assign(value)
  }
}

proto.value = function() {
  var out = []
  for (var item of this._from._outcomes) {
    if (item.isUndefined() || item.isNull()) {
      continue
    }
    var prop = item.getprop(this._propName, this._immediate)
    if (prop) {
      var value = prop.value()
      if (value) {
        out.push(value)
      }
    }
  }
  if (!out.length) {
    return null
  }
  return Either.from(this._from.cfg, out)
}

