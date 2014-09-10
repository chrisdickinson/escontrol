module.exports = install

var typeOf = require('./types.js')

function install(proto) {
  proto.visitUnaryExpression = visitUnaryExpression
}

function visitUnaryExpression(node) {
  this._pushFrame(visitedArgument, node)
  this._visit(node.argument)
}

function visitedArgument(node) {
  var lhs = this._valueStack.pop()
  var value = combine(lhs, node.operator)

  this._connect(this.last(), {
    operation: 'unary ' + node.operator,
    value: value
  })
  this._valueStack.push(value)
}

function combine(lhs, op) {
  var newType = lhs.type & (getTypes(op) | typeOf.STATIC)
  var value = null

  if (newType & typeOf.STATIC) {
    value = applyOperation(lhs.staticValue, op)
  }

  return {
    staticValue: value,
    type: newType
  }
}

function getTypes(op) {
  switch(op) {
    case '!':
      return typeOf.BOOLEAN
    case '-':
    case '+':
    case '~':
      return typeOf.NUMBER
    case 'void':
      return typeOf.UNDEFINED
    case 'new':
      return typeOf.OBJECT
    case 'typeof':
      return typeOf.STRING
  }

  return typeOf.ANY
}

function applyOperation(value, op) {
  switch(op) {
    case 'typeof': return typeof value
    case 'new': return null
    case '!': return !value
    case '-': return -value
    case '+': return +value
    case '~': return ~value
    case 'void': return
  }
}
