'use strict'

module.exports = Membrane

var WrappedName = require('./name-wrapped.js')
var BaseValue = require('./base.js')
var Name = require('./name.js')

var inherits = require('inherits')

function Membrane(cfg, parentScope) {
  BaseValue.call(this, cfg)
  var parentRef = new Name('[[ParentScope]]', this, cfg)
  parentRef.assign(parentScope)
  this._parentScope = parentRef
  this._names = new Map()
  this._wraps = new Set()
}

inherits(Membrane, BaseValue)

var proto = Membrane.prototype

proto.getprop = function(prop, immediate) {
  var wrapped = this._names.get(prop) || null
  if (wrapped) {
    return wrapped
  }
  var parent = this._parentScope.value()
  if (!parent) {
    throw new Error('unattached membrane')
  }
  var name = parent.getprop(prop, immediate)
  if (name) {
    wrapped = new WrappedName(this.cfg, name, this._wraps)
  }
  return wrapped
}

proto.newprop = function(prop) {
  var parent = this._parentScope.value()
  if (!parent) {
    throw new Error('unattached membrane')
  }
  parent.newprop(prop)
  return this.getprop(prop)
}

proto.delprop = function(prop) {
  return this.parent.delprop(prop)
}

proto.unwrapAll = function(stack) {
  var newScope = this._parentScope.value()
  var refs = this._references
  for (var ref of refs) {
    ref.assign(newScope)
  }
  this._parentScope.assign(null)
  for (var xs of this._wraps) {
    xs.permanentUnwrap()
  }
  for (var i = 0; i < stack.length; ++i) {
    while (this._wraps.has(stack[i])) {
      stack[i] = stack[i].unwrap()
    }
  }
  this._wraps.clear()
  this._names.clear()
  return newScope
}

proto.getBlockType = function() {
  return '(Branch)'
}
