'use strict'

module.exports = WrappedValue

var inherits = require('inherits')

var WrappedName = require('./name-wrapped.js')
var BaseValue = require('./base.js')
var Either = require('./either.js')

function WrappedValue(obj, branchNo, parent) {
  BaseValue.call(this, null)

  this._wrapped = obj
  this.branchNumber = branchNo

  // _prototype is here so it can stand in for a scope object.
  this._prototype = parent
  this._wrappedNames = {__proto__: null}
}

inherits(WrappedValue, BaseValue)

var proto = WrappedValue.prototype

function _copyOnWrite(wrap) {
  var refs = wrap._wrapped._references.slice()
  var copy = wrap._wrapped.copy()
  var val = new Either(wrap._wrapped, copy)

  val._marks = wrap._marks
  copy._marks = wrap._marks
  wrap._wrapped._references.length = 0

  for(var i = 0, len = refs.length; i < len; ++i) {
    if (refs[i].branchNumber === wrap.branchNumber) {
      refs[i].assign(copy)
    } else {
      refs[i].assign(val)
    }
  }

  return copy
}

proto.copy = function WrappedValue_copy() {
  var copied = new WrappedValue(this._wrapped, this.branchNumber, this._prototype)
  
  for(var key in this._wrappedNames) {
    copied._wrappedNames[key] = this._wrappedNames[key]
  }

  return copied
}

proto.getprop = function WrappedValue_getprop(prop) {
  var wname = this._wrappedNames[prop]
  var name

  if (wname) {
    return wname
  }

  name = this._wrapped.getprop(prop)

  return name ? this._wrappedNames[prop] = new WrappedName(name, this.branchNumber) : null
}

proto.newprop = function WrappedValue_newprop(prop) {
  return _copyOnWrite(this).newprop(prop)
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
  return this._wrapped.call.apply(this._wrapped, arguments)
}

proto.instantiate = function() {
  return this._wrapped.instantiate.apply(this._wrapped, arguments)
}

proto.unwrap = function() {
  return this._wrapped
}

// TODO: these two methods mutate assumptions about what they wrap
// and should be promoted to "either"s
proto.assumeDefined = function() {
  return this._wrapped.assumeDefined()
}

proto.assumeFunction = function() {
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

