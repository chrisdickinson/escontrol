'use strict'

module.exports = getNull

var inherits = require('inherits')
var BaseValue = require('./base.js')

function getNull() {
  return getNull.value = getNull.value || new Null
}

function Null() {
  BaseValue.call(this, null)
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
