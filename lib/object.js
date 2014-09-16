module.exports = ObjectValue

var createName = require('./name.js')
var typeOf = require('./types.js')
var Value = require('./value.js')

var HCI_EXPANDO = 0
var HCI_ARRAY = 1
var HCI_REGEXP = 2
var HCI_FUNCTION = 3
var HCI_EMPTY = 4

var hiddenClasses = [null, null, null, null, new HiddenClass('Object')]

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

function ObjectValue(type, hci, code) {
  this._type = type
  this._code = code
  this._hiddenClassID = hci || HCI_EMPTY
  this._attributes = {}
  this._prototype = null
}

ObjectValue.HCI_EXPANDO = HCI_EXPANDO
ObjectValue.HCI_ARRAY = HCI_ARRAY
ObjectValue.HCI_REGEXP = HCI_REGEXP
ObjectValue.HCI_FUNCTION = HCI_FUNCTION
ObjectValue.HCI_EMPTY = HCI_EMPTY

var proto = ObjectValue.prototype

proto.lookup = function Object_lookup(prop, immediate) {
  if (prop in this._attributes) {
    return this._attributes[prop]
  }

  if (!immediate && this._prototype) {
    return this._prototype.getattr(prop)
  }

  return null
}

proto.declare = function Object_declare(prop) {
  var name = this._attributes[prop] = createName(prop)

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
  this._types &= types & 0xFF
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
