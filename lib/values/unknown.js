'use strict'

module.exports = Unknown

var hidden = require('./hidden-class.js')
var ObjectValue = require('./object.js')
var inherits = require('inherits')

function Unknown(builtins) {
  ObjectValue.call(this, builtins, hidden.initial.UNKNOWN, null)
  this._assumeDefined = false
}

inherits(Unknown, ObjectValue)

var proto = Unknown.prototype

/**
proto.getprop = function Unknown_getprop() {
  throw new Error('not implemented')
}

proto.newprop = function Unknown_newprop() {
  throw new Error('not implemented')
}

proto.delprop = function Unknown_delprop() {
  throw new Error('not implemented')
}
**/

proto.copy = function Unknown_copy() {
  throw new Error('not implemented')
}

proto.classInfo = function() {
  return '<Unknown>'
}

proto.isUnknown = function() {
  return true
}

proto.isUndefined = function() {
  return !this._assumeDefined
}

proto.assumeDefined = function() {
  this._assumeDefined = true
}
