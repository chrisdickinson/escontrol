module.exports = install

var typeOf = require('./types.js')

function install(proto) {
  proto.visitBinaryExpression = visitBinaryExpression
}

function visitBinaryExpression(node) {
  this._pushFrame(visitedLeft, node)
  this._visit(node.left)
}

function visitedLeft(node) {
  this._pushFrame(visitedRight, node)
  this._visit(node.right)
}

function visitedRight(node) {
  var rhs = this._valueStack.pop()
  var lhs = this._valueStack.pop()
  var value = combine(lhs, rhs, node.operator)

  this._connect(this.last(), {
    operation: node.operator,
    value: value
  })
  this._valueStack.push(value)
}

function combine(lhs, rhs, op) {
  var mask = lhs.type | rhs.type
  var newType = mask & (getTypes(mask, op) | typeOf.STATIC)
  var value = null

  if (newType & typeOf.STATIC) {
    value = applyOperation(lhs.staticValue, rhs.staticValue, op)
  }

  return {
    staticValue: value,
    type: newType
  }
}

function applyOperation(lhs, rhs, operation) {
  return Function('lhs', 'rhs', 'return lhs ' + operation + 'rhs')(lhs, rhs)
}

function getTypes(mask, op) {
  switch (op) {
    case '+':
      return typeOf.STRING | typeOf.NUMBER

    case '-':
    case '++':
    case '--':
    case '~':
    case '&':
    case '^':
    case '|':
    case '*':
    case '/':
    case '%':
    case '<<':
    case '>>':
    case '>>>':
      return typeOf.NUMBER

    case '==':
    case '!=':
    case '===':
    case '!==':
    case '>=':
    case '<=':
    case '>':
    case '<':
    case 'in':
    case 'delete':
    case 'instanceof':
      return typeOf.BOOLEAN
    case '&&':
    case '||':
      return mask
  }
}
