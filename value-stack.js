module.exports = ValueStack

var typeOf = require('./lib/types.js')

function ValueStack() {
  if (!(this instanceof ValueStack)) {
    return new ValueStack
  }

  this._values = []
}

var cons = ValueStack
var proto = cons.prototype

proto.push = function (value, isStatic) {
  this._values.push({
    staticValue: value,
    type: typeOf(value) | (isStatic ? typeOf.STATIC : 0)
  })
}

proto.pop = function () {
  return this._values.pop()
}

proto.info = function () {
  var last = this._values[this._values.length - 1]
  return last
}
