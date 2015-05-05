'use strict'

module.exports = getNull

var hidden = require('./hidden-class.js')
var BaseValue = require('./base.js')
var inherits = require('inherits')

const perCFG = new WeakMap()

function getNull(cfg) {
  if (!perCFG.has(cfg)) {
    perCFG.set(cfg, new Null(cfg))
  }
  return perCFG.get(cfg)
}


function Null(cfg) {
  BaseValue.call(this, cfg)
  this._hcid = hidden.initial.NULL
}

inherits(Null, BaseValue)
var proto = Null.prototype

proto.classInfo = function() {
  return 'null'
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
