module.exports = install

var typeOf = require('./types.js')
var ObjectValue = require('./object.js')

function install(proto) {
  proto.visitMemberExpression = visitMemberExpression
}

function visitMemberExpression(node) {
  this._pushFrame(this._isLValue() ? visitedObjectLValue : visitedObject, node)
  this._visit(node.object)
}

function visitedObjectLValue(node) {
  if (!node.computed) {
    var obj = this._valueStack.pop()

    if (obj.type() & (typeOf.UNDEFINED | typeOf.NULL)) {
      this._throwException('TypeError')
      obj.andTypes(~(typeOf.UNDEFINED | typeOf.NULL))
    }

    this._connect(this.last(), {'operation': 'setattr', 'attr': node.property.name})

    var name = obj.lookup(node.property.name, true) || obj.declare(node.property.name)

    this._valueStack._values.push(name)

    return
  }

  this._pushFrame(visitedPropertyLValue, node)
  this._visit(node.property)
}

function visitedPropertyLValue(node) {
  var obj = this._valueStack.pop().toObject()
  var prop = this._valueStack.pop()

  this._connect(this.last(), {operation: 'setattr', 'attr': '(dynamic)'})
  this._valueStack._values.push(createName('???'))
}

function visitedObject(node) {
  if (!node.computed) {
    var obj = this._valueStack.pop().toObject()

    if (obj.type() & (typeOf.UNDEFINED | typeOf.NULL)) {
      this._throwException('TypeError')
      obj.andTypes(~(typeOf.UNDEFINED | typeOf.NULL))
    }

    var val = obj.lookup(node.property.name)
    val = val ? val.value() :
      obj.type() & typeOf.STATIC ? obj.makeUndefined() :
      ObjectValue.createUnknown()

    this._connect(this.last(), {operation: 'getattr', 'attr': node.property.name})
    this._valueStack._values.push(val)

    return
  }

  this._pushFrame(visitedProperty, node)
  this._visit(node.property)
}

function visitedProperty(node) {
  var prop = this._valueStack.pop().toValue()
  var obj = this._valueStack.pop().toObject()

  if (obj.type() & (typeOf.UNDEFINED | typeOf.NULL)) {
    this._throwException('TypeError')
    obj.andTypes(~(typeOf.UNDEFINED | typeOf.NULL))
  }

  this._valueStack._values.push(ObjectValue.createUnknown())
  this._connect(this.last(), {
      'operation': 'getattr',
      'attr': '(dynamic)'
  })
}
