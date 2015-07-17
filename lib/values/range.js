'use strict'

module.exports = Range

var hidden    = require('./hidden-class.js')
var unwrapAll = require('../unwrap-all.js')
var Either    = require('./either.js')
var Value     = require('./value.js')
var BaseValue = require('./base.js')
var Name      = require('./name.js')
var inherits  = require('inherits')

// an "Either" that represents a range of integers.
function Range(cfg, lowerBound, upperBound, step) {
  this._lowerBound = lowerBound
  this._upperBound = upperBound
  this._step = step
  BaseValue.call(this, cfg)
}

inherits(Range, BaseValue)

var proto = Range.prototype

Object.defineProperty(proto, '_prototype', {
  get: function() {
    return this.cfg._builtins.getprop('[[NumberProto]]').value()
  },
  set: function(v) {
    // nop
  }
})

proto.outcomes = function() {
  var out = []
  var cfg = this.cfg
  for (var i = this._lowerBound; i < this._upperBound; i += this._step) {
    out.push(cfg.makeValue('number', i))
  }
  return out
}

proto.getHCID = function() {
  return [hidden.initial.NUMBER]
}

proto.getMark = function(key) {
  this._marks = this._marks || {__proto__: null}
  if (key in this._marks) {
    return this._marks[key]
  }
  return []
}

proto.setMark = function(key, value) {
  this._marks = this._marks || {__proto__: null}
  this._marks[key] = value
}

proto.classInfo = function() {
  return 'Range<[' + this._lowerBound + ' ... ' + this._upperBound + ']>'
}

proto.getprop = function(prop, imm) {
  if (!imm) {
    return this._prototype.getprop(prop, imm)
  }
  return null
}

proto.newprop = function(prop, name) {
  return name || new Name(prop, this, this.cfg)
}

proto.delprop = function() {

}

// true!
proto.isEither = Boolean.bind(null, true)

// false!
proto.isString =
proto.isUndefined =
proto.isNull =
proto.isUnknown =
proto.isFunction = Boolean

proto.assumeDefined = noop
proto.assumeFunction = noop

proto.asLookup = function(against) {
  var out = new Set()
  for (var i = this._lowerBound; i < this._upperBound; i += this._step) {
    out.add(against.getprop(i).value())
  }
  return Either.from(this.cfg, out)
}

function noop() {

}
