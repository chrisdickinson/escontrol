'use strict'

module.exports = Either

var makeUndefined = require('./undefined.js')

function Either(lhs, rhs) {
  this._lhs = lhs
  this._rhs = rhs
  this._references = []
}

var proto = Either.prototype

proto.copy = function() {
  return new Either(this._lhs.copy(), this._rhs.copy())
}

proto.lookup = function Either_lookup(prop, immediate) {
  var lhsName = this._lhs.lookup(prop, immediate)
  var rhsName = this._rhs.lookup(prop, immediate)

  // if they're both null, or they're both
  // the same property.
  if (lhsName === rhsName) {
    return lhsName
  }

  return new EitherName(lhsName, rhsName, this, prop)
}

proto.declare = function Either_declare(prop, name) {
  var out = this._rhs.declare(prop, this._lhs.declare(prop, name))
  out.setCurrentSourceObject(this)
  return out
}

proto.del = function Either_del(prop) {
  this._lhs.del(prop)
  this._rhs.del(prop)
}

proto.type = function() {
  return this._lhs.type() | this._rhs.type()
}

proto.andTypes = function(types) {
  this._lhs.andTypes(types)
  this._rhs.andTypes(types)
}

proto.toValue = function() {
  return this
}

proto.toObject = function() {
  return this
}

proto.addRef = function(name) {
  this._references.push(name)
}

proto.removeRef = function(name) {
  var idx = this._references.indexOf(name)
  this._references.splice(idx, 1)
}

function EitherName(lname, rname, from, propName) {
  if (!lname && !rname) throw new Error('wtf')

  this._lname = lname
  this._rname = rname
  this._from = from
  this._propName = propName
  this._currentSource = null
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
    this._lname = this._from._lhs.declare(this.propName)
  }

  if (this._rname === null) {
    this._rname = this._from._rhs.declare(this.propName)
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
