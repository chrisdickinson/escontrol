'use strict'

module.exports = Either

var inherits = require('inherits')

var BaseValue = require('./base.js')
var makeUndefined = require('./undefined.js')
var unwrapAll = require('../unwrap-all.js')

function Either(lhs, rhs) {
  BaseValue.call(this, null)
  this._lhs = unwrapAll(lhs)
  this._rhs = unwrapAll(rhs)
}

inherits(Either, BaseValue)

var proto = Either.prototype

proto.classInfo = function () {
  var flat = []

  function recurse(node) {
    if (node instanceof Either) {
      recurse(node._lhs)
      recurse(node._rhs)
    } else {
      var ci = node ? node.classInfo() : '<' + node + '>'

      if (flat.indexOf(ci) === -1) {
        flat.push(ci)
      }
    }
  }

  recurse(this)
  return 'Either<' + flat.join(', ') + '>'
}

proto.copy = function() {
  return new Either(this._lhs.copy(), this._rhs.copy())
}

proto.getprop = function Either_getprop(prop, immediate) {
  var lhsThrows =
    this._lhs.isUndefined() ||
    this._lhs.isNull()

  var rhsThrows =
    this._rhs.isUndefined() ||
    this._rhs.isNull()

  var lhsName = !lhsThrows && this._lhs.getprop(prop, immediate)
  var rhsName = !rhsThrows && this._rhs.getprop(prop, immediate)

  // if they're both null, or they're both
  // the same property.
  if (lhsName === rhsName) {
    return lhsName
  }

  return new EitherName(lhsName, rhsName, this, prop, lhsThrows || rhsThrows)
}

proto.newprop = function Either_newprop(prop, name) {
  var out = this._rhs.newprop(prop, this._lhs.newprop(prop, name))
  out.setCurrentSourceObject(this)
  return out
}

proto.delprop = function Either_delprop(prop) {
  this._lhs.delprop(prop)
  this._rhs.delprop(prop)
}

function EitherName(lname, rname, from, propName, canThrow) {
  if (!lname && !rname) throw new Error('wtf')

  this._lname = lname
  this._rname = rname
  this._from = from
  this._propName = propName
  this._currentSource = null
  this.canThrow = canThrow
}

var proto = EitherName.prototype

proto.setCurrentSourceObject = function(current) {
  this._currentSource = current
}

proto.getCurrentSourceObject = function() {
  return this._currentSource
}

proto.assign = function(value) {
  if (this._lname === null) {
    this._lname = this._from._lhs.newprop(this._propName)
  }

  if (this._rname === null) {
    this._rname = this._from._rhs.newprop(this._propName)
  }

  this._lname.assign(value)
  this._rname.assign(value)
}

proto.value = function() {
  return new Either(
    this._lname && this._lname.value() || makeUndefined(),
    this._rname && this._rname.value() || makeUndefined()
  )
}
