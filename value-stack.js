module.exports = ValueStack

var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var Value = require('./lib/values/value.js')

function ValueStack(cfg) {
  if (!(this instanceof ValueStack)) {
    return new ValueStack(cfg)
  }

  this._values = []
  this._fence = {at: -1}
  this._fence.prev = this._fence
  this._cfg = cfg
}

var cons = ValueStack
var proto = cons.prototype

proto.push = function (value) {
  this._values.push(value)
  this._cfg.onpushvalue(value)
}

proto.pushHole = function() {
  this._values.push(null)
  this._cfg.onpushvalue(null)
}

proto.pop = function () {
  if (this._values.length - 1 < this._fence.at) {
    throw new Error('crossed fence!')
  }

  var output = this._values.pop()
  this._cfg.onpopvalue(output)
  return output
}

proto.current = function () {
  var last = this._values[this._values.length - 1]
  return last
}

proto.fence = function() {
  this._fence = {at: this._values.length, prev: this._fence}
}

proto.unfence = function() {
  this._fence = this._fence.prev
}

proto.toArray = function(len) {
  var objectValue = this._cfg.makeArray(len)

  if (len) {
    var values = this._values.slice(-len)
    this._values.length -= len
    for (var i = values.length - 1; i > -1; --i) {
      this._cfg.onpopvalue(values[i])
    }

    if (values.length < len) {
      throw new Error('not enough values')
    }

    if (this._values.length < this._fence.at) {
      throw new Error('crossed fence!')
    }

    for (var i = 0, len = values.length; i < len; ++i) {
      if (!values[i]) {
        continue
      }

      objectValue.newprop(i).assign(values[i])
    }
  }

  this.push(objectValue)
}

proto.toObject = function(len) {
  var objectValue = this._cfg.makeObject()

  if (len) {
    var values = len ? this._values.slice(len * -2) : []
    for (var i = values.length - 1; i > -1; --i) {
      this._cfg.onpopvalue(values[i])
    }
    this._values.length -= len * 2

    if (this._values.length < this._fence.at) {
      throw new Error('crossed fence!')
    }

    for (var i = 0, len = values.length; i < len; i += 2) {
      objectValue.newprop(values[i]).assign(values[i + 1])
    }
  }

  this.push(objectValue)
}
