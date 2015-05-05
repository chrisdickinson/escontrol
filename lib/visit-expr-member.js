'use strict'

module.exports = install

var Operation = require('../operation.js')
var unwrap = require('./unwrap-all.js')
var Name = require('./values/name.js')

function install(proto) {
  proto.visitMemberExpression = visitMemberExpression
}

function visitMemberExpression(node) {
  this._pushFrame(this._isLValue() || this._isCallee() ? visitedObjectLValue : visitedObject, node)
  this._visit(node.object)
}

function visitedObjectLValue(node) {
  if (!node.computed) {
    this._connect(this.last(), new Operation(Operation.kind.LOAD_PROP_NAME, node.property.name, null, null))

    var obj = this._valueStack.pop()
    var name = null
    if (obj.isUnknown() && (obj.isUndefined() || obj.isNull())) {
      this._throwException('TypeError')
      obj.assumeDefined()
    } else if (obj.isUndefined() || obj.isNull()) {
      this._throwException('TypeError')
      if (!obj.isEither()) {
        name = new Name('??? unreachable (' + node.name + ')')
        name.assign(this.makeUnknown())
        name.setCurrentSourceObject(this.makeUnknown())
      }
    }

    if (name === null) {
      name = obj.getprop(node.property.name, !this._isCallee())
      name = name || obj.newprop(node.property.name)
    }

    this._valueStack.push(name)
    return
  }

  this._pushFrame(visitedPropertyLValue, node)
  this._visit(node.property)
}

function visitedPropertyLValue(node) {
  this._connect(this.last(), new Operation(Operation.kind.LOAD_PROP_NAME_DYN, null, null, null))
  var obj = this._valueStack.pop()
  var prop = this._valueStack.pop()

  // TODO: lookup static values; make this make sense
  var name = new Name('???')
  name.assign(this.makeUnknown())
  name.setCurrentSourceObject(obj)
  this._valueStack.push(name)
}

function visitedObject(node) {
  if (!node.computed) {
    this._connect(this.last(), new Operation(Operation.kind.LOAD_PROP_VALUE, node.property.name, null, null))
    var obj = this._valueStack.pop()

    if (obj.isUnknown() && (obj.isUndefined() || obj.isNull())) {
      this._throwException('TypeError')
      obj.assumeDefined()
    } else if (obj.isUndefined() || obj.isNull()) {
      this._throwException('TypeError')

      // all bets are off, now
      obj = this.makeUnknown()
    }

    var val = obj.getprop(node.property.name, false)

    // "EitherName" values can throw
    if (val && val.canThrow) {
      this._throwException('TypeError')
    }

    val = val ? val.value() : this.makeUnknown()

    // XXX: fixme, this is a hack
    if (!val) {
      val = this.makeUnknown()
    }

    this._valueStack.push(val)

    return
  }

  this._pushFrame(visitedProperty, node)
  this._visit(node.property)
}

function visitedProperty(node) {
  this._connect(this.last(), new Operation(Operation.kind.LOAD_PROP_VALUE_DYN, null, null, null))
  var prop = this._valueStack.pop()
  var obj = this._valueStack.pop()

  if (obj.isUnknown() && obj.isUndefined()) {
    this._throwException('TypeError')
    obj.assumeDefined()
  } else if (obj.isUndefined()) {
    this._throwException('TypeError')
  }

  this._valueStack.push(this.makeUnknown())
}
