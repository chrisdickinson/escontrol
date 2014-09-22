'use strict'

module.exports = WrappedObject

var WrappedName = require('./wrapped-name.js')
var Either = require('./either.js')

function WrappedObject(obj, branchNo, parent) {
  this._wrapped = obj
  this.branchNumber = branchNo

  // _prototype is here so it can stand in for a scope object.
  this._prototype = parent
  this._wrappedNames = {__proto__: null}
}

var proto = WrappedObject.prototype

proto.unwrap = function() {
  return this._wrapped
}

function _copyOnWrite(wrap) {
  var refs = wrap._wrapped._references.slice()
  var copy = wrap._wrapped.copy()
  var val = new Either(wrap._wrapped, copy)

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

proto.type = function() {
  return this._wrapped.type()
}

proto.andTypes = function(types) {
  if (types & this._wrapped.type() !== this._wrapped.type()) {
    return _copyOnWrite(this).andTypes(prop, name)
  }
}

proto.declare = function Branched_declare(prop, name) {
  return _copyOnWrite(this).declare(prop, name)
}

proto.del = function Branched_del(prop) {
  return _copyOnWrite(this).del(prop, name)
}

proto.toValue = function() {
  return this._wrapped.toValue()
}

proto.toObject = function() {
  return this
}

proto.lookup = function Branched_lookup(prop) {
  var wname = this._wrappedNames[prop]
  var name

  if (wname) {
    return wname
  }

  name = this._wrapped.lookup(prop)

  return name ? this._wrappedNames[prop] = new WrappedName(name, this.branchNumber) : null
}