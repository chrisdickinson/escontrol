'use strict'

module.exports = Value

var inherits = require('inherits')

var hidden = require('./hidden-class.js')
var ObjectValue = require('./object.js')
var BaseValue = require('./base.js')

function Value(builtins, type, value) {
  BaseValue.call(this, builtins)
  this._coerceTo = builtins.getprop({
    'boolean': '[[BooleanProto]]',
    'string': '[[StringProto]]',
    'number': '[[NumberProto]]'
  }[type]).value()
  this._objHCI = {
    'boolean': hidden.initial.BOOLEAN,
    'string': hidden.initial.STRING,
    'number': hidden.initial.NUMBER
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
    'boolean': 'Boolean'
  }[this._type] + '<' + this._value + '>'
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
  return new ObjectValue(this._builtins, this._objHCI, this._coerceTo)
}

proto.isString = function() {
  return this._type === 'string'
}
