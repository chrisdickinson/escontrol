module.exports = ValueStack

var typeOf = require('./lib/types.js')

var ObjectValue = require('./lib/object.js')
var Value = require('./lib/value.js')

function ValueStack() {
  if (!(this instanceof ValueStack)) {
    return new ValueStack
  }

  this._values = []
}

var cons = ValueStack
var proto = cons.prototype

proto.push = function (value, isStatic) {
  var wrapped = new Value(
    typeOf(value) | (isStatic ? typeOf.STATIC : 0),
    value
  )
  this._values.push(wrapped)
}

proto.pushHole = function() {
  this._values.push(null)
}

proto.pushKey = function(key) {
  this._values.push(key)
}

proto.pop = function () {
  return this._values.pop()
}

proto.current = function () {
  var last = this._values[this._values.length - 1]
  return last
}

proto.toArray = function(len) {
  var values = this._values.slice(-len)
  var objectValue = new ObjectValue(typeOf.OBJECT, ObjectValue.HCI_ARRAY, null)
  this._values.length -= len
  var isStatic = true

  for (var i = 0, len = values.length; i < len; ++i) {
    if (!values[i]) {
      continue
    }

    objectValue.declare(i).assign(values[i])
    if (isStatic && (values[i].type & typeOf.STATIC) === 0) {
      isStatic = false
    }
  }

  if (isStatic) {
    objectValue._type &= typeOf.STATIC
  }

  this._values.push(objectValue)
}

proto.toObject = function(len) {
  var values = this._values.slice(len * -2)
  var objectValue = new ObjectValue(typeOf.OBJECT, ObjectValue.HCI_EMPTY, null)
  this._values.length -= len * 2
  var isStatic = true

  for (var i = 0, len = values.length; i < len; i += 2) {
    objectValue.declare(values[i]).assign(values[i + 1])
    if (isStatic && (values[i + 1].type & typeOf.STATIC) === 0) {
      isStatic = false
    }
  }

  if (isStatic) {
    objectValue._type &= typeOf.STATIC
  }

  this._values.push(objectValue)
}
