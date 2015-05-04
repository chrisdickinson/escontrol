module.exports = combine

var Operation = require('../operation.js')
var Either = require('./values/either.js')

combine.operationMap = {
  '+': Operation.kind.ADD,
  '-': Operation.kind.SUB,
  '++': Operation.kind.INCR,
  '--': Operation.kind.DECR,
  '&': Operation.kind.BAND,
  '^': Operation.kind.BXOR,
  '|': Operation.kind.BOR,
  '*': Operation.kind.MUL,
  '/': Operation.kind.DIV,
  '%': Operation.kind.MOD,
  '<<': Operation.kind.LSHF,
  '>>': Operation.kind.RSHF,
  '>>>': Operation.kind.RDSHF,
  '==': Operation.kind.EQ,
  '!=': Operation.kind.NEQ,
  '===': Operation.kind.SEQ,
  '!==': Operation.kind.SNEQ,
  '>=': Operation.kind.GEQ,
  '<=': Operation.kind.LEQ,
  '>': Operation.kind.GT,
  '<': Operation.kind.LT,
  'in': Operation.kind.IN,
  'delete': Operation.kind.DELETE,
  'instanceof': Operation.kind.INSTANCEOF,
  '&&': Operation.kind.LAND,
  '||': Operation.kind.LOR
}

function combine(cfg, lhs, rhs, op) {
  var result = _combine(cfg, lhs, rhs, op)
  cfg.onoperation([lhs, rhs], op, result)
  return result
}

function _combine(cfg, lhs, rhs, op) {
  // TODO: make it actually statically apply the values.
  switch (op) {
    case '+':
      return cfg.makeValue(lhs.isString() || rhs.isString() ? 'string' : 'number')

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
      return cfg.makeValue('number')

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
      return cfg.makeValue('boolean')
    case '&&':
    case '||':
      return Either.of(lhs, rhs)
  }
}

