'use strict'

module.exports = getUndefined

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var inherits = require('inherits')

function getUndefined() {
  return getUndefined.value = getUndefined.value || new Undefined
}

function Undefined() {
  BaseValue.call(this, null)
  this._hcid = hidden.initial.UNDEFINED
}

inherits(Undefined, BaseValue)
var proto = Undefined.prototype

proto.classInfo = function() {
  return 'undefined'
}

proto.copy = function() {
  return this
}

proto.isUndefined = function() {
  return true
}

proto.isString = function() {
  return false
}
