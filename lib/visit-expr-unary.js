'use strict'

module.exports = install

var Operation = require('../operation.js')

combine.operationMap = {
  '!': Operation.kind.NOT,
  '-': Operation.kind.NEG,
  '+': Operation.kind.POS,
  '~': Operation.kind.BINV,
  'void': Operation.kind.VOID,
  'typeof': Operation.kind.TYPEOF,
  'delete': Operation.kind.DELETE
}

function install(proto) {
  proto.visitUnaryExpression = visitUnaryExpression
}

function visitUnaryExpression(node) {
  if (node.operator === 'delete') {
    this._pushFrame(visitedDeleteArgument, node, false, true)
  } else {
    this._pushFrame(visitedArgument, node)
  }
  this._visit(node.argument)
}

function visitedDeleteArgument(node) {
  var lhsName = this._valueStack.pop()
  var target = lhsName.getCurrentSourceObject()
  if (target) {
    target.delprop(lhsName.getName())
  }
  this._connect(this.last(), new Operation(combine.operationMap[node.operator], null, null, null))
  this._valueStack.push(this.makeValue('boolean'))
}

function visitedArgument(node) {
  this._connect(this.last(), new Operation(combine.operationMap[node.operator], null, null, null))
  var lhs = this._valueStack.pop()

  this._valueStack.push(combine(this, lhs.toValue(), node.operator))
}

function combine(cfg, value, op) {
  var result = _combine(cfg, value, op)
  cfg.onoperation([value], op, result)
  return result
}

function _combine(cfg, value, op) {
  switch(op) {
    case '!':
      return cfg.makeValue('boolean')
    case '-':
    case '+':
    case '~':
      return cfg.makeValue('number')
    case 'void':
      return cfg.makeUndefined()
    case 'typeof':
      return cfg.makeValue('string')
  }

  return cfg.makeUnknown()
}
