'use strict'

module.exports = Either

var inherits = require('inherits')

var makeUndefined = require('./undefined.js')
var unwrapAll = require('../unwrap-all.js')
var Undefined = require('./undefined.js')
var BaseValue = require('./base.js')
var Null = require('./null.js')


function Either(lhs, rhs) {
  if (lhs === rhs) {
    return lhs
  }

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

  if(!(lhsName || rhsName)) {
    return null
  }

  var out = new EitherName(lhsName, rhsName, this, prop, lhsThrows || rhsThrows)

  out.setCurrentSourceObject(this)

  return out
}

proto.newprop = function Either_newprop(prop, name) {
  if (this._lhs === Undefined() || this._lhs === Null()) {
    if (this._rhs === Undefined() || this._rhs === Null()) {
      throw new Error('lhs: cannot create a new property')
    }

    return this._rhs.newprop(prop)
  }

  if (this._rhs === Undefined() || this._rhs === Null()) {
    if (this._lhs === Undefined() || this._lhs === Null()) {
      throw new Error('rhs, cannot create a new property')
    }

    return this._lhs.newprop(prop)
  }

  var out = this._rhs.newprop(prop, this._lhs.newprop(prop, name))
  out.setCurrentSourceObject(this)
  return out
}

proto.delprop = function Either_delprop(prop) {
  this._lhs.delprop(prop)
  this._rhs.delprop(prop)
}

proto.isUndefined = function() {
  return this._lhs.isUndefined() || this._rhs.isUndefined()
}

proto.isNull = function() {
  return this._lhs.isNull() || this._rhs.isNull()
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
  if (!this._lname && !(this._from._lhs.isUndefined() || this._from._lhs.isNull())) {
    this._lname = this._from._lhs.newprop(this._propName)
  }

  if (!this._rname && !(this._from._rhs.isUndefined() || this._from._rhs.isNull())) {
    this._rname = this._from._rhs.newprop(this._propName)
  }

  if (this._lname) this._lname.assign(value)
  if (this._rname) this._rname.assign(value)
}

proto.value = function() {
  return new Either(
    this._lname && this._lname.value() || makeUndefined(),
    this._rname && this._rname.value() || makeUndefined()
  )
}
