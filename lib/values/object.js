'use strict'

module.exports = ObjectValue

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var Value = require('./value.js')
var Name = require('./name.js')

function ObjectValue(builtins, hcid, prototype) {
  BaseValue.call(this, builtins)

  this._hcid = hcid
  this._prototype = prototype
  this._attributes = {__proto__: null}
}

inherits(ObjectValue, BaseValue)

var proto = ObjectValue.prototype

proto.isString = function() {
  var name = this.getprop('toString')

  if (name && name.value() && name.value().isFunction()) {
    return true
  }
  return false
}

proto.classInfo = function ObjectValue_classInfo(depth) {
  return hidden.get(this._hcid).toName() + ':' + this._hcid
}

proto.newprop = function ObjectValue_newprop(prop, name) {
  if (prop === '__proto__') {
    return this._createPrototypeName()
  }

  var name = this._attributes[prop] = name || new Name(String(prop))

  switch(this._hcid) {
    case hidden.initial.GLOBAL:
    case hidden.initial.EXPANDO: break
    case hidden.initial.ARRAY:
      if (!isNaN(prop) || prop === 'length') break
    default:
      this._hcid = hidden.advance(this._hcid, prop)
  }

  name.setCurrentSourceObject(this)

  return name
}

proto.getprop = function ObjectValue_getprop(name, immediate) {
  if (name === '__proto__') {
    var n = new Name('__proto__')

    if (this._prototype) {
      n.assign(this._prototype)
    }
    return n
  }

  if (this._attributes[name]) {
    return this._attributes[name]
  }

  if (!immediate && this._prototype) {
    var val = this._prototype.getprop(name)

    if (val) {
      val.setCurrentSourceObject(this)
    }

    return val
  }

  return null
}

proto.delprop = function ObjectValue_delprop(name) {
  if (!this._attributes[prop]) {
    return
  }

  this._attributes[prop].value()
    .removeRef(this._attributes[prop])

  delete this._attributes[prop]
  this._hcid = hidden.initial.EXPANDO
}

proto.copy = function ObjectValue_copy() {
  var copy = new ObjectValue(this._builtins, this._hcid, this._prototype)

  for (var key in this._attributes) {
    copy._attributes[key] = this._attributes[key]
  }

  return copy
}

proto._createPrototypeName = function() {
  var name = new Name('__proto__')
  var self = this

  name.assign = function _PrototypeName_assign(value) {
    var result = Name.prototype.assign.call(this, value)

    self._assignPrototype(result)

    return result
  }

  return name
}

proto._assignPrototype = function ObjectValue_assignPrototype(value) {
  this._prototype = value.toObject()
}

proto._toValue = function ObjectValue_toValue() {
  var valueOf = this.getprop('valueOf')
  var toString = this.getprop('toString')

  // TODO: how to coerce Unknown?
  if (!valueOf) {
    if (!toString) {
      return new Value(this._builtins, 'string')
      throw new Error('cannot coerce')
    }

    return new Value(this._builtins, 'string')
  }

  return new Value(this._builtins, 'string')
}

proto.toValue = function() {
  var val = this._valueOf()
  val._marks = this._marks
  return val
}
