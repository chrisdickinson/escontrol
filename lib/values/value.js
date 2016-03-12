'use strict'

module.exports = Value

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')

function Value(cfg, type, value) {
  BaseValue.call(this, cfg)
  this._coerceTo = cfg._builtins.getprop({
    'boolean': '[[BooleanProto]]',
    'string': '[[StringProto]]',
    'number': '[[NumberProto]]',
    'symbol': '[[SymbolProto]]'
  }[type]).value()
  this._hcid = {
    'boolean': hidden.initial.BOOLEAN,
    'string': hidden.initial.STRING,
    'number': hidden.initial.NUMBER,
    'symbol': hidden.initial.SYMBOL
  }[type]
  this._value = value
  this._type = type
}

inherits(Value, BaseValue)

var proto = Value.prototype

proto.classInfo = function Value_classInfo() {
  return {
    'string': 'String',
    'number': 'Number',
    'boolean': 'Boolean',
    'symbol': 'Symbol'
  }[this._type]
}

proto.getprop = function Value_getprop(name, immediate) {
  return this.toObject().getprop(name, immediate)
}

proto.newprop = function Value_newprop(prop, name) {
  return this.toObject().newprop(prop, name)
}

proto.delprop = function Value_delprop() {
  return
}

proto.copy = function Value_copy() {
  return this
}

proto.toObject = function Value_toObject() {
  return this.cfg.makeObject(this._hcid, this._coerceTo)
}

proto.isString = function() {
  return this._type === 'string'
}

proto.asLookup = function(against) {
  if (!this._value) {
    return this.cfg.makeUnknown()
  }

  var prop = against.getprop(this._value)
  var val = prop ? prop.value() : this.cfg.makeUndefined()
  return val || this.cfg.makeUndefined()
}
