'use strict'

module.exports = install

var Undefined = require('./values/undefined.js')
var Unknown = require('./values/unknown.js')
var typeOf = require('./types.js')

function install(proto) {
  proto.visitMemberExpression = visitMemberExpression
}

function visitMemberExpression(node) {
  this._pushFrame(this._isLValue() ? visitedObjectLValue : visitedObject, node)
  this._visit(node.object)
}

function visitedObjectLValue(node) {
  if (!node.computed) {
    this._connect(this.last(), {'operation': 'setprop', 'attr': node.property.name})

    var obj = this._valueStack.pop()
    if (obj.isUnknown() && obj.isUndefined()) {
      this._throwException('TypeError')
      obj.assumeDefined()
    } else if (obj.isUndefined()) {
      this._throwException('TypeError')
    }

    var name = obj.getprop(node.property.name, true) || obj.newprop(node.property.name)

    this._valueStack.push(name)

    return
  }

  this._pushFrame(visitedPropertyLValue, node)
  this._visit(node.property)
}

function visitedPropertyLValue(node) {
  this._connect(this.last(), {operation: 'setprop', 'attr': '(dynamic)'})
  var obj = this._valueStack.pop()
  var prop = this._valueStack.pop()

  // TODO: createName!
  this._valueStack.push(createName('???'))
}

function visitedObject(node) {
  if (!node.computed) {
    this._connect(this.last(), {operation: 'getprop', 'attr': node.property.name})

    var obj = this._valueStack.pop()

    if (obj.isUnknown() && obj.isUndefined()) {
      this._throwException('TypeError')
      obj.assumeDefined()
    } else if (obj.isUndefined()) {
      this._throwException('TypeError')
    }

    var val = obj.getprop(node.property.name, false)

    // "EitherName" values can throw
    if (val && val.canThrow) {
      this._throwException('TypeError')
    }

    val = val ? val.value() : new Unknown(this._builtins)

    this._valueStack.push(val)

    return
  }

  this._pushFrame(visitedProperty, node)
  this._visit(node.property)
}

function visitedProperty(node) {
  this._connect(this.last(), {
      'operation': 'getprop',
      'attr': '(dynamic)'
  })
  var prop = this._valueStack.pop()
  var obj = this._valueStack.pop()

  if (obj.isUnknown() && obj.isUndefined()) {
    this._throwException('TypeError')
    obj.assumeDefined()
  } else if (obj.isUndefined()) {
    this._throwException('TypeError')
  }

  this._valueStack.push(new Unknown(this._builtins))
}
