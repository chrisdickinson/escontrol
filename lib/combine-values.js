module.exports = combine

var Either = require('./values/either.js')
var Value = require('./values/value.js')

combine.operationMap = {
  '+': 'add',
  '-': 'sub',
  '++': 'incr',
  '--': 'decr',
  '&': 'band',
  '^': 'bxor',
  '|': 'bor',
  '*': 'mul',
  '/': 'div',
  '%': 'mod',
  '<<': 'lshf',
  '>>': 'rshf',
  '>>>': 'rdshf',
  '==': 'eq',
  '!=': 'neq',
  '===': 'seq',
  '!==': 'sneq',
  '>=': 'geq',
  '<=': 'leq',
  '>': 'gt',
  '<': 'lt',
  'in': 'in',
  'delete': 'delete',
  'instanceof': 'instanceof',
  '&&': 'land',
  '||': 'lor'
}

function combine(builtins, lhs, rhs, op) {
  // TODO: make it actually statically apply the values.
  switch (op) {
    case '+':
      return new Value(builtins, lhs.isString() || rhs.isString() ? 'string' : 'number')

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
      return new Value(builtins, 'number')

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
      return new Value(builtins, 'boolean')
    case '&&':
    case '||':
      return new Either(lhs, rhs)
  }
}

