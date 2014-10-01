module.exports = ValueStack

var typeOf = require('./lib/types.js')

var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')

function ValueStack(builtins) {
  if (!(this instanceof ValueStack)) {
    return new ValueStack(builtins)
  }

  this._values = []
  this._builtins = builtins
}

var cons = ValueStack
var proto = cons.prototype

proto.push = function (value) {
  this._values.push(value)
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

proto.toArray = function(len) {
  var values = this._values.slice(-len)
  var objectValue = new ObjectValue(this._builtins, hidden.initial.ARRAY, this._builtins.newprop('[[ArrayProto]]').value())
  this._values.length -= len
  var isStatic = true

  for (var i = 0, len = values.length; i < len; ++i) {
    if (!values[i]) {
      continue
    }

    objectValue.newprop(i).assign(values[i])
    if (isStatic && (values[i].type & typeOf.STATIC) === 0) {
      isStatic = false
    }
  }

  if (isStatic) {
    objectValue._type &= typeOf.STATIC
  }

  this._values.push(objectValue)
}

proto.toObject = function(len, builtins) {
  var values = len ? this._values.slice(len * -2) : []
  var objectValue = new ObjectValue(builtins, hidden.initial.EMPTY, this._builtins.newprop('[[ObjectProto]]').value())
  this._values.length -= len * 2
  var isStatic = true

  for (var i = 0, len = values.length; i < len; i += 2) {
    objectValue.newprop(values[i]).assign(values[i + 1])
    if (isStatic && (values[i + 1].type & typeOf.STATIC) === 0) {
      isStatic = false
    }
  }

  if (isStatic) {
    objectValue._type &= typeOf.STATIC
  }

  this._values.push(objectValue)
}
