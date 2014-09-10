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

proto.current = function () {
  var last = this._values[this._values.length - 1]
  return last
}

proto.toArray = function() {
  var values = this._values.slice()

  this._values.length = 0
  var isStatic = true
  var staticValue = new Array(values.length)

  for(var i = 0, len = values.length; i < len; ++i) {
    if ((values[i].type & typeOf.STATIC) === 0) {
      isStatic = false
      break
    }

    staticValue[i] = values[i].staticValue
  }

  this.push(staticValue, isStatic)
}
