'use strict'

module.exports = getUndefined

var inherits = require('inherits')
var BaseValue = require('./base.js')

function getUndefined() {
  return getUndefined.value = getUndefined.value || new Undefined
}

function Undefined() {
  BaseValue.call(this, null)
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
