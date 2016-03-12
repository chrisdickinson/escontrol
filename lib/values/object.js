'use strict'

module.exports = ObjectValue

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var Name = require('./name.js')

function ObjectValue(cfg, hcid, proto, parentMap) {
  BaseValue.call(this, cfg)

  this._hcid = hcid

  var protoName = new Name('[[Proto]]', this, cfg)
  protoName.assign(proto)
  this._protoRef = protoName
  this._attributes = parentMap ? new Map(parentMap.entries()) : new Map()
}

inherits(ObjectValue, BaseValue)

var proto = ObjectValue.prototype

Object.defineProperty(proto, '_prototype', {
  get: function() {
    return this._protoRef.value()
  },
  set: function(v) {
    this._protoRef.assign(v)
    return this._protoRef.value()
  }
})

proto.names = function*() {
  for(const tuple of this._attributes) {
    yield tuple[1]
  }
}

proto.isString = function() {
  var name = this.getprop('toString')

  if (name && name.value() && name.value().isFunction()) {
    return true
  }
  return false
}

proto.classInfo = function ObjectValue_classInfo(depth) {
  return hidden.get(this._hcid).toName()
}

proto.newprop = function ObjectValue_newprop(prop, name) {
  if (prop === '__proto__') {
    return this._protoRef
  }

  prop = String(prop)
  var hadProp = this._attributes.has(prop)
  if (!name) {
    name = new Name(prop, this, this.cfg)
  }
  this._attributes.set(prop, name)

  if (!hadProp)
  switch(this._hcid) {
    case hidden.initial.SCOPE:
    case hidden.initial.ARGUMENTS:
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
    return this._protoRef
  }

  name = String(name)
  if (this._attributes.has(name)) {
    return this._attributes.get(name)
  }

  if (!immediate && this._prototype && !this._prototype.isNull()) {
    var val = this._prototype.getprop(name)

    if (val) {
      val.setCurrentSourceObject(this)
    }

    return val
  }

  return null
}

proto.delprop = function ObjectValue_delprop(prop) {
  prop = String(prop)
  if (!this._attributes.has(prop)) {
    return
  }

  if (!this._attributes.get(prop).value()) {
    this._attributes.delete(prop)
    return
  }

  this._attributes.get(prop).value()
    .removeRef(this._attributes.get(prop))

  this._attributes.delete(prop)
  this._hcid = hidden.initial.EXPANDO
}

proto.copy = function ObjectValue_copy() {
  return new ObjectValue(this.cfg, this._hcid, this._prototype, this._attributes)
}

proto._toValue = function ObjectValue_toValue() {
  if (this.isUndefined() || this.isNull()) {
    return this
  }

  var valueOf = this.getprop('valueOf')
  var toString = this.getprop('toString')

  // TODO: how to coerce Unknown?
  if (!valueOf) {
    if (!toString) {
      return this.cfg.makeValue('string')
      throw new Error('cannot coerce')
    }

    return this.cfg.makeValue('string')
  }

  return this.cfg.makeValue('string')
}

proto.toValue = function() {
  var val = this._toValue()
  val._marks = this._marks
  return val
}

proto.asLookup = function(against) {
  // XXX(chrisdickinson): lies! but maybe
  // useful-ish lies.
  return this.cfg.makeValue('[object Object]').asLookup(against)
}
