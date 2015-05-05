'use strict'

module.exports = WrappedValue

var inherits = require('inherits')

var WrappedName = require('./name-wrapped.js')
var BaseValue = require('./base.js')
var Either = require('./either.js')
var Name = require('./name.js')

// Keep WrappedValues separately from BaseValues –
// we don't want any automatic tracking of them.
const toCFG = new WeakMap()

function WrappedValue(cfg, obj, branchValues) {
  BaseValue.call(this, null)

  toCFG.set(this, cfg)
  branchValues.add(this)
  this._wrapped = obj
  this.branchValues = branchValues

  this._wrappedNames = new Map()
}

inherits(WrappedValue, BaseValue)

var proto = WrappedValue.prototype

Object.defineProperty(proto, 'cfg', {
  get() {
    return toCFG.get(this)
  },
  enumerable: false
})

Object.defineProperty(proto, '_prototype', {
  get: function() {
    return this._protoRef.value()
  },
  set: function(v) {
    // XXX: this should copyOnWrite the value.
    this._protoRef.assign(v)
    return this._protoRef.value()
  }
})

function _copyOnWrite(wrap) {
  wrap.branchValues.delete(wrap)
  var refs = new Set()
  for (var xs of wrap._wrapped._references) {
    refs.add(xs)
  }
  var copy = wrap._wrapped.copy()
  var val = Either.of(wrap._wrapped, copy)

  val._marks = wrap._marks
  copy._marks = wrap._marks
  wrap._wrapped._references.clear()

  for (var ref of refs) {
    if (ref.branchValues === wrap.branchValues) {
      ref.assign(copy)
    } else {
      ref.assign(val)
    }
  }

  return copy
}

proto.copy = function WrappedValue_copy() {
  var copied = new WrappedValue(this.cfg, this._wrapped, this.branchValues)
  
  for(var tuple in this._wrappedNames) {
    copied._wrappedNames.set(tuple[0], tuple[1])
  }

  return copied
}

proto.getprop = function WrappedValue_getprop(prop) {
  var wname = this._wrappedNames.get(prop) || null
  var name

  if (wname) {
    return wname
  }

  name = this._wrapped.getprop(prop)

  if (name) {
    wname = new WrappedName(this.cfg, name, this.branchValues)
    this._wrappedNames.set(prop, wname)
  }
  return wname
}

proto.newprop = function WrappedValue_newprop(prop, name) {
  return _copyOnWrite(this).newprop(prop, name)
}

proto.delprop = function WrappedValue_delprop(prop) {
  return _copyOnWrite(this).delprop(prop)
}

proto.classInfo = function() {
  return '(' + this._wrapped.classInfo() + ')'
}

proto.toValue = function() {
  return this._wrapped.toValue()
}

proto.call = function() {
  if (this._wrapped.call) {
    return this._wrapped.call.apply(this._wrapped, arguments)
  }
}

proto.instantiate = function() {
  return this._wrapped.instantiate.apply(this._wrapped, arguments)
}

proto.unwrap = function() {
  return this._wrapped
}

proto.permanentUnwrap = function() {
  var value = this._wrapped
  for (var ref of this._references) {
    ref._value = value
    value.addRef(ref)
  }
  this._references.clear()
  this._wrappedNames.clear()
}

// TODO: these two methods mutate assumptions about what they wrap
// and should be promoted to "either"s
proto.assumeDefined = function() {
  if (this._wrapped.assumeDefined)
    return this._wrapped.assumeDefined()
}

proto.assumeFunction = function() {
  if (this._wrapped.assumeFunction)
    return this._wrapped.assumeFunction()
}

var checks = [
  'isNull',
  'isUndefined',
  'isObject',
  'isFunction',
  'isUnknown',
  'isString',
  'isValue'
]

checks.forEach(function(xs) {
  proto[xs] = function () {
    return this._wrapped[xs]()
  }
})

proto.getHCID = function() {
  return this._wrapped.getHCID()
}

