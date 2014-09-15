module.exports = ObjectValue

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
  this._attributeOperations = []
  this._attrCache = {}
}

ObjectValue.HCI_EXPANDO = HCI_EXPANDO
ObjectValue.HCI_ARRAY = HCI_ARRAY
ObjectValue.HCI_REGEXP = HCI_REGEXP
ObjectValue.HCI_FUNCTION = HCI_FUNCTION
ObjectValue.HCI_EMPTY = HCI_EMPTY

var proto = ObjectValue.prototype

proto.getattr = function Object_getattr(prop) {
  if (this._attrCache[prop]) {
    return this._attrCache[prop]
  }

  // otherwise, run through the operations
  var value = null
  for (var i = this._attributeOperations.length - 1; i > -1; --i) {
    if (this._attributeOperations[i].attr !== prop) continue
    break
  }

  if (i === -1) {
    return
  }

  return this._attrCache[prop] = this._attributeOperations[i].value
}

proto.setattr = function Object_setattr(prop, value) {
  delete this._attrCache[prop]

  this._attributeOperations.push({
    attr: prop,
    value: value
  })

  if (this._hiddenClassID === HCI_ARRAY && !isNaN(prop)) {
    return
  }

  if (this._hiddenClassID !== HCI_EXPANDO) {
    this._hiddenClassID = advanceHiddenClassPath(this._hiddenClassID, prop)
  }
}

proto.delattr = function Object_delattr(prop) {
  delete this._attrCache[prop]

  this._hiddenClassID = HCI_EXPANDO
  this._attributeOperations.push({
    attr: prop,
    value: null
  })
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
