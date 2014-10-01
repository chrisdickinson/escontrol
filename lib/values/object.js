'use strict'

module.exports = ObjectValue

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var Value = require('./base.js')
var Name = require('./name.js')

function ObjectValue(builtins, hcid, prototype) {
  BaseValue.call(this, builtins)

  if (hcid === undefined) throw new Error('fak')

  this._hcid = hcid
  this._prototype = prototype
  this._attributes = {__proto__: null}
}

inherits(ObjectValue, BaseValue)

var proto = ObjectValue.prototype

proto.classInfo = function ObjectValue_classInfo() {
  return hidden.get(this._hcid).toName()
}

proto.newprop = function ObjectValue_newprop(prop, name) {
  if (prop === '__proto__') {
    return this._createPrototypeName()
  }

  var name = this._attributes[prop] = name || new Name(String(prop))

  this._hcid = hidden.advance(this._hcid, prop)
  name.setCurrentSourceObject(this)

  return name
}

proto.getprop = function ObjectValue_getprop(name, immediate) {
  if (name === '__proto__') {
    var n = new Name('__proto__')

    n.assign(this._prototype)
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
  this._hcid = HCI_EXPANDO
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

proto.toValue = function ObjectValue_toValue() {
  var valueOf = this.getprop('valueOf')
  var toString = this.getprop('toString')

  if (!valueOf) {
    if (!toString) {
      throw new Error('cannot coerce')
    }

    return new Value(this._builtins)
  }

  return new Value(this._builtins, 'string')
}
