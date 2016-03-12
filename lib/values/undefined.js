'use strict'

module.exports = getUndefined

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var inherits = require('inherits')

const perCFG = new WeakMap()

function getUndefined(cfg) {
  if (!perCFG.has(cfg)) {
    perCFG.set(cfg, new Undefined(cfg))
  }
  return perCFG.get(cfg)
}

function Undefined(cfg) {
  BaseValue.call(this, cfg)
  this._hcid = hidden.initial.UNDEFINED
}

inherits(Undefined, BaseValue)
var proto = Undefined.prototype

proto.classInfo = function() {
  return 'Undefined'
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
