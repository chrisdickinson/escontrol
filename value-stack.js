module.exports = ValueStack

var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var Value = require('./lib/values/value.js')

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
  var objectValue = new ObjectValue(this._builtins, hidden.initial.ARRAY, this._builtins.newprop('[[ArrayProto]]').value())
  objectValue.newprop('length').assign(new Value(this._builtins, 'number', len))

  if (len) {
    var values = this._values.slice(-len)
    this._values.length -= len

    for (var i = 0, len = values.length; i < len; ++i) {
      if (!values[i]) {
        continue
      }

      objectValue.newprop(i).assign(values[i])
    }
  }

  this._values.push(objectValue)
}

proto.toObject = function(len, builtins) {
  var objectValue = new ObjectValue(builtins, hidden.initial.EMPTY, this._builtins.newprop('[[ObjectProto]]').value())

  if (len) {
    var values = len ? this._values.slice(len * -2) : []
    this._values.length -= len * 2
    var isStatic = true

    for (var i = 0, len = values.length; i < len; i += 2) {
      objectValue.newprop(values[i]).assign(values[i + 1])
    }
  }

  this._values.push(objectValue)
}
