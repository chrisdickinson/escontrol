'use strict'

module.exports = ObjectValue

var Name = require('./name.js')
var typeOf = require('./types.js')
var Value = require('./value.js')

var HCI_EXPANDO = -1
var HCI_ARRAY = 1
var HCI_REGEXP = 2
var HCI_FUNCTION = 3
var HCI_STRING = 4
var HCI_BOOLEAN = 5
var HCI_UNKNOWN = 6
var HCI_EMPTY = 7

var hiddenClasses = [
  null,
  new HiddenClass('Array'),
  new HiddenClass('RegExp'),
  new HiddenClass('Function'),
  new HiddenClass('String'),
  new HiddenClass('Boolean'),
  new HiddenClass('Unknown'),
  new HiddenClass('Object')
]

function HiddenClass(strName, prev) {
  this._name = strName || null
  this._prev = prev || null
  this._edges = {__proto__: null}
}

HiddenClass.prototype.advance = function(prop, hci) {
  var next = this._edges[prop]

  if (next === undefined) {
    next = hiddenClasses.push(new HiddenClass(prop, hci)) - 1
    this._edges[prop] = next
  }

  return next
}

HiddenClass.prototype.toName = function() {
  var current = this
  var attrs = []

  while (current) {
    attrs.unshift(current._name)
    current = hiddenClasses[current._prev]
  }

  var name = attrs.shift()

  return name + ':{' + attrs.join(', ') + '}'
}

function advanceHiddenClassPath(hci, prop) {
  var hiddenClass = hiddenClasses[hci]

  return hiddenClass.advance(prop, hci)
}

function ObjectValue(type, hci, prototype, code) {
  this._type = type
  this._code = code
  this._hiddenClassID = hci || HCI_EMPTY
  this._attributes = {__proto__: null}
  this._references = []
  this._prototype = prototype || null
}

ObjectValue.HCI_EXPANDO = HCI_EXPANDO
ObjectValue.HCI_ARRAY = HCI_ARRAY
ObjectValue.HCI_REGEXP = HCI_REGEXP
ObjectValue.HCI_FUNCTION = HCI_FUNCTION
ObjectValue.HCI_STRING = HCI_STRING
ObjectValue.HCI_BOOLEAN = HCI_BOOLEAN
ObjectValue.HCI_UNKNOWN = HCI_UNKNOWN
ObjectValue.HCI_EMPTY = HCI_EMPTY

ObjectValue.createUnknown = function(types) {
  types = types || typeOf.ANY
  types &= ~typeOf.STATIC & 0xFF

  return new ObjectValue(types, HCI_UNKNOWN)
}

var proto = ObjectValue.prototype

proto.copy = function () {
  var copy = new ObjectValue(0, ObjectValue.HCI_EXPANDO, null, null)

  copy._type = this._type
  copy._code = this._code
  copy._hiddenClassID = this._hiddenClassID
  for (var key in this._attributes) {
    copy._attributes[key] = this._attributes[key]
  }
  copy._prototype = this._prototype

  return copy
}

proto.classInfo = function() {
  return hiddenClasses[this._hiddenClassID].toName()
}

proto.lookup = function Object_lookup(prop, immediate) {
  if (this._attributes[prop]) {
    return this._attributes[prop]
  }

  if (!immediate && this._prototype) {
    var val = this._prototype.lookup(prop)

    if (val) {
      val.setCurrentSourceObject(this)
    }

    return val
  }

  return null
}

proto.declare = function Object_declare(prop, name) {
  var name = this._attributes[prop] = name || new Name(String(prop))

  this._hiddenClassID = advanceHiddenClassPath(this._hiddenClassID, prop)
  name.setCurrentSourceObject(this)

  return name
}

proto.del = function Object_del(prop) {
  if (!this._attributes[prop]) {
    return
  }

  this._attributes[prop].value()
    .removeRef(this._attributes[prop])
}

proto.type = function() {
  return this._type
}

proto.andTypes = function(types) {
  this._type &= types & 0xFF
}

proto.toValue = function() {
  return new Value(this._type & (~typeOf.OBJECT & 0xFF))
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
