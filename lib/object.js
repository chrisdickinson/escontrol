'use strict'

module.exports = ObjectValue

var Name = require('./name.js')
var typeOf = require('./types.js')
var Value = require('./value.js')

var HCI_EXPANDO = 0
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
  null,
  null,
  null,
  null,
  new HiddenClass('Unknown'),
  new HiddenClass('Object')
]

function HiddenClass(strName, prev) {
  this._name = strName || null
  this._prev = prev || null
  this._edges = {}
}

HiddenClass.prototype.advance = function(prop, hci) {
  var next = this._edges[prop]

  if (next === undefined) {
    next = hiddenClasses.push(new HiddenClass(null, hci)) - 1
    this._edges[prop] = next
  }

  return next
}

function advanceHiddenClassPath(hci, prop) {
  var hiddenClass = hiddenClasses[hci]

  return hiddenClass.advance(prop, hci)
}

function ObjectValue(type, hci, prototype, code) {
  this._type = type
  this._code = code
  this._hiddenClassID = hci || HCI_EMPTY
  this._attributes = {}
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

proto.lookup = function Object_lookup(prop, immediate) {
  if (this._attributes[prop]) {
    return this._attributes[prop]
  }

  if (!immediate && this._prototype) {
    return this._prototype.lookup(prop)
  }

  return null
}

proto.declare = function Object_declare(prop) {
  var name = this._attributes[prop] = new Name(String(prop))

  this._hiddenClassID = advanceHiddenClassPath(this._hiddenClassID, prop)

  return name
}

proto.del = function Object_del(prop) {
  delete this._attributes[prop]
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

proto.makeUndefined = function() {
  return new Value(typeOf.UNDEFINED, void 0)
}
