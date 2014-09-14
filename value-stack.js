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

proto.pop = function () {
  return this._values.pop()
}

proto.current = function () {
  var last = this._values[this._values.length - 1]
  return last
}

proto.toArray = function() {
  var values = this._values.slice()
  var objectValue = new ObjectValue(typeOf.OBJECT, ObjectValue.HCI_ARRAY, null)
  this._values.length = 0
  var isStatic = true
  var staticValue = new Array(values.length)

  for (var i = 0, len = values.length; i < len; ++i) {
    if (!values[i]) {
      continue
    }

    objectValue.setattr(i, values[i])
    if (isStatic && (values[i].type & typeOf.STATIC) === 0) {
      isStatic = false
    }
  }

  if (isStatic) {
    objectValue._type &= typeOf.STATIC
  }

  this._values.push(objectValue)
}
