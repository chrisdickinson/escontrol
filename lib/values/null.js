'use strict'

module.exports = getNull

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var inherits = require('inherits')

function getNull() {
  return getNull.value = getNull.value || new Null
}

function Null() {
  BaseValue.call(this, null)
  this._hcid = hidden.initial.NULL
}

inherits(Null, BaseValue)
var proto = Null.prototype

proto.classInfo = function() {
  return 'undefined'
}

proto.copy = function() {
  return this
}

proto.isNull = function() {
  return true
}

proto.isString = function() {
  return false
}
