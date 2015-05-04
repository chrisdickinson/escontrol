'use strict'

module.exports = Scope

var hidden = require('./hidden-class.js')
var ObjectValue = require('./object.js')
var inherits = require('inherits')

function Scope(cfg, lastScope, type) {
  ObjectValue.call(this, cfg, hidden.initial.SCOPE, lastScope)
  this._blockType = type
}

inherits(Scope, ObjectValue)

var proto = Scope.prototype

proto.copy = function() {
  return new Scope(this.cfg, this._prototype, this._blockType)
}

proto.getprop = function(prop, immediate) {
  if (prop === '__proto__') {
    prop += '\0'
  }
  return ObjectValue.prototype.getprop.call(this, prop, immediate)
}

proto.newprop = function(prop, name) {
  if (prop === '__proto__') {
    prop += '\0'
  }
  return ObjectValue.prototype.newprop.call(this, prop, name)
}

proto.getBlockType = function() {
  return this._blockType
}
