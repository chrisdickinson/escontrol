'use strict'

module.exports = Unknown

var hidden = require('./hidden-class.js')
var ObjectValue = require('./object.js')
var inherits = require('inherits')

function Unknown(cfg, parentMap) {
  ObjectValue.call(this, cfg, hidden.initial.UNKNOWN, null, parentMap)
  this._assumeDefined = false
  this._assumeFunction = false
}

inherits(Unknown, ObjectValue)

var proto = Unknown.prototype

proto.getprop = function Unknown_getprop(prop, immediate) {
  var name = ObjectValue.prototype.getprop.call(this, prop, immediate)

  // alright whatever, really
  if (!name) {
    name = this.newprop(prop)
    name.assign(new Unknown(this.cfg))
    return name
  }

  return name
}

proto.copy = function Unknown_copy() {
  var copy = new Unknown(this.cfg, this._attributes)
  copy._assumeDefined = this._assumeDefined
  copy._assumeFunction = this._assumeFunction
  copy._hcid = this._hcid

  return copy
}

proto.classInfo = function() {
  return (
    !this._assumeDefined ? 'Unknown' :
    this._assumeFunction ? 'UnknownFunction' :
    'UnknownObject'
  )
}

proto.isUnknown = function() {
  return true
}

proto.isNull =
proto.isUndefined = function() {
  return !this._assumeDefined
}

proto.isFunction = function() {
  return this._assumeFunction
}

proto.assumeDefined = function() {
  this._assumeDefined = true
}

proto.assumeFunction = function() {
  this._assumeFunction = true
  this._assumeDefined = true
}
