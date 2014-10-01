'use strict'

module.exports = install

var hidden = require('./values/hidden-class.js')
var Undefined = require('./values/undefined.js')
var ObjectValue = require('./values/object.js')
var Value = require('./values/value.js')
var Null = require('./values/null.js')

function install(proto) {
  proto.visitLiteral = visitLiteral
}

function visitLiteral(node) {
  var value

  if (node.value instanceof RegExp) {
    value = new ObjectValue(
      this._builtins,
      hidden.initial.REGEXP,
      this._builtins.getprop('[[RegExpProto]]').value()
    )
  } else if (node.value === null) {
    value = Null()
  } else if (node.value === undefined) {
    value = Undefined()
  } else {
    value = new Value(this._builtins, typeof node.value, node.value)
  }

  this._pushValue(value, true)
}
