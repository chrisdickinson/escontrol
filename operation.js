module.exports = Operation

var _ = 0

Operation.id = 0

function Operation(kind, arg0, arg1, arg2) {
  this._id = ++Operation.id
  this._kind = kind
  this._arg0 = arg0
  this._arg1 = arg1
  this._arg2 = arg2

  this._incoming = 0
  this._outgoing = 0

  this._next = null

  this._hasSpecialOutgoing = false
  this._hasSpecialIncoming = false
  this._isUnreachable = kind === Operation.kind.UNREACHABLE
}

Operation.prototype.canSimplify = function Operation_canSimplify() {
  return !(this._hasSpecialIncoming || this._hasSpecialOutgoing) && this._incoming < 2 && this._outgoing < 2
}

Operation.prototype.receive = function Operation_receive(edge) {
  ++this._incoming
  this._hasSpecialIncoming = this._hasSpecialIncoming || (edge.kind !== 'normal')

  if (edge.from && edge.from._isUnreachable) {
    this._isUnreachable = true
  } else {
    this._isUnreachable = false
  }
}

Operation.prototype.send = function Operation_send(edge) {
  ++this._outgoing
  this._hasSpecialOutgoing = this._hasSpecialOutgoing || (edge.kind !== 'normal')

  if (this._outgoing === 1 && !this._hasSpecialOutgoing) {
    this._next = edge
  } else {
    this._next = null
  }

}

Operation.prototype.kind = function Operation_kind() {
  return this._kind
}

Operation.prototype.human = function Operation_human() {
  return this._id + ': ' + Operation.mneumonic[this._kind] + '{' + [this._arg0, this._arg1, this._arg2].filter(Boolean).join(',') + '}'
}

Operation.kind = {
  UNREACHABLE: _++,
  ADD: _++,
  BAND: _++,
  BINV: _++,
  BOR: _++,
  BXOR: _++,
  CALL: _++,
  CREATE_FUNCTION: _++,
  DECR: _++,
  DELETE: _++,
  DIV: _++,
  EQ: _++,
  GEQ: _++,
  GT: _++,
  IN: _++,
  INCR: _++,
  INSTANCEOF: _++,
  LAND: _++,
  LEQ: _++,
  LOAD_NAME: _++,
  LOAD_PROP_NAME: _++,
  LOAD_PROP_NAME_DYN: _++,
  LOAD_PROP_VALUE: _++,
  LOAD_PROP_VALUE_DYN: _++,
  LOAD_VALUE: _++,
  LOR: _++,
  LSHF: _++,
  LT: _++,
  MOD: _++,
  MUL: _++,
  NEG: _++,
  NEQ: _++,
  NEW: _++,
  NEXT_KEY: _++,
  NOT: _++,
  POP: _++,
  POS: _++,
  RDSHF: _++,
  RSHF: _++,
  SEQ: _++,
  SNEQ: _++,
  STORE_VALUE: _++,
  SUB: _++,
  TEST: _++,
  TYPEOF: _++,
  VOID: _++,
  PREINCR: _++,
  PREDECR: _++,
  POSTINCR: _++,
  POSTDECR: _++,
  SWITCH_STORE: _++,
  SWITCH_COMPARE: _++,
  LOAD_LITERAL: _++,
  LOAD_LITERAL_ARRAY: _++,
  LOAD_LITERAL_OBJECT: _++,
  MATH_RANDOM: _++,
  MATH_ABS: _++,
  MATH_ACOS: _++,
  MATH_ASIN: _++,
  MATH_ATAN: _++,
  MATH_CEIL: _++,
  MATH_COS: _++,
  MATH_EXP: _++,
  MATH_FLOOR: _++,
  MATH_LOG: _++,
  MATH_ROUND: _++,
  MATH_SIN: _++,
  MATH_SQRT: _++,
  MATH_TAN: _++,
  MATH_ATAN2: _++,
  MATH_POW: _++,
  MATH_MAX: _++,
  MATH_MIN: _++, 


  // fake ops:
  ENTER: _++,
  EXIT: _++,
  EXC: _++
}
    'random',
    'abs',
    'acos',
    'asin',
    'atan',
    'ceil',
    'cos',
    'exp',
    'floor',
    'log',
    'round',
    'sin',
    'sqrt',
    'tan',
    'atan2',
    'pow',
    'max',
    'min' 

Operation.mneumonic = []
Operation.mneumonic[Operation.kind.UNREACHABLE] = 'UNREACHABLE'
Operation.mneumonic[Operation.kind.ADD] = 'ADD'
Operation.mneumonic[Operation.kind.BAND] = 'BAND'
Operation.mneumonic[Operation.kind.BINV] = 'BINV'
Operation.mneumonic[Operation.kind.BOR] = 'BOR'
Operation.mneumonic[Operation.kind.BXOR] = 'BXOR'
Operation.mneumonic[Operation.kind.CALL] = 'CALL'
Operation.mneumonic[Operation.kind.CREATE_FUNCTION] = 'CREATE_FUNCTION'
Operation.mneumonic[Operation.kind.DECR] = 'DECR'
Operation.mneumonic[Operation.kind.DELETE] = 'DELETE'
Operation.mneumonic[Operation.kind.DIV] = 'DIV'
Operation.mneumonic[Operation.kind.EQ] = 'EQ'
Operation.mneumonic[Operation.kind.GEQ] = 'GEQ'
Operation.mneumonic[Operation.kind.GT] = 'GT'
Operation.mneumonic[Operation.kind.IN] = 'IN'
Operation.mneumonic[Operation.kind.INCR] = 'INCR'
Operation.mneumonic[Operation.kind.INSTANCEOF] = 'INSTANCEOF'
Operation.mneumonic[Operation.kind.LAND] = 'LAND'
Operation.mneumonic[Operation.kind.LEQ] = 'LEQ'
Operation.mneumonic[Operation.kind.LOAD_NAME] = 'LOAD_NAME'
Operation.mneumonic[Operation.kind.LOAD_PROP_NAME] = 'LOAD_PROP_NAME'
Operation.mneumonic[Operation.kind.LOAD_PROP_VALUE] = 'LOAD_PROP_VALUE'
Operation.mneumonic[Operation.kind.LOAD_PROP_NAME_DYN] = 'LOAD_PROP_NAME_DYN'
Operation.mneumonic[Operation.kind.LOAD_PROP_VALUE_DYN] = 'LOAD_PROP_VALUE_DYN'
Operation.mneumonic[Operation.kind.LOAD_VALUE] = 'LOAD_VALUE'
Operation.mneumonic[Operation.kind.LOR] = 'LOR'
Operation.mneumonic[Operation.kind.LSHF] = 'LSHF'
Operation.mneumonic[Operation.kind.LT] = 'LT'
Operation.mneumonic[Operation.kind.MOD] = 'MOD'
Operation.mneumonic[Operation.kind.MUL] = 'MUL'
Operation.mneumonic[Operation.kind.NEG] = 'NEG'
Operation.mneumonic[Operation.kind.NEQ] = 'NEQ'
Operation.mneumonic[Operation.kind.NEW] = 'NEW'
Operation.mneumonic[Operation.kind.NEXT_KEY] = 'NEXT_KEY'
Operation.mneumonic[Operation.kind.NOT] = 'NOT'
Operation.mneumonic[Operation.kind.POP] = 'POP'
Operation.mneumonic[Operation.kind.POS] = 'POS'
Operation.mneumonic[Operation.kind.RDSHF] = 'RDSHF'
Operation.mneumonic[Operation.kind.RSHF] = 'RSHF'
Operation.mneumonic[Operation.kind.SEQ] = 'SEQ'
Operation.mneumonic[Operation.kind.SNEQ] = 'SNEQ'
Operation.mneumonic[Operation.kind.STORE_VALUE] = 'STORE_VALUE'
Operation.mneumonic[Operation.kind.SUB] = 'SUB'
Operation.mneumonic[Operation.kind.TEST] = 'TEST'
Operation.mneumonic[Operation.kind.TYPEOF] = 'TYPEOF'
Operation.mneumonic[Operation.kind.VOID] = 'VOID'
Operation.mneumonic[Operation.kind.PREINCR] = 'PREINCR'
Operation.mneumonic[Operation.kind.PREDECR] = 'PREDECR'
Operation.mneumonic[Operation.kind.POSTINCR] = 'POSTINCR'
Operation.mneumonic[Operation.kind.POSTDECR] = 'POSTDECR'
Operation.mneumonic[Operation.kind.SWITCH_STORE] = 'SWITCH_STORE'
Operation.mneumonic[Operation.kind.SWITCH_COMPARE] = 'SWITCH_COMPARE'
Operation.mneumonic[Operation.kind.LOAD_LITERAL] = 'LOAD_LITERAL'
Operation.mneumonic[Operation.kind.LOAD_LITERAL_ARRAY] = 'LOAD_LITERAL_ARRAY'
Operation.mneumonic[Operation.kind.LOAD_LITERAL_OBJECT] = 'LOAD_LITERAL_OBJECT'
Operation.mneumonic[Operation.kind.MATH_RANDOM] = 'MATH_RANDOM'
Operation.mneumonic[Operation.kind.MATH_ABS] = 'MATH_ABS'
Operation.mneumonic[Operation.kind.MATH_ACOS] = 'MATH_ACOS'
Operation.mneumonic[Operation.kind.MATH_ASIN] = 'MATH_ASIN'
Operation.mneumonic[Operation.kind.MATH_ATAN] = 'MATH_ATAN'
Operation.mneumonic[Operation.kind.MATH_CEIL] = 'MATH_CEIL'
Operation.mneumonic[Operation.kind.MATH_COS] = 'MATH_COS'
Operation.mneumonic[Operation.kind.MATH_EXP] = 'MATH_EXP'
Operation.mneumonic[Operation.kind.MATH_FLOOR] = 'MATH_FLOOR'
Operation.mneumonic[Operation.kind.MATH_LOG] = 'MATH_LOG'
Operation.mneumonic[Operation.kind.MATH_ROUND] = 'MATH_ROUND'
Operation.mneumonic[Operation.kind.MATH_SIN] = 'MATH_SIN'
Operation.mneumonic[Operation.kind.MATH_SQRT] = 'MATH_SQRT'
Operation.mneumonic[Operation.kind.MATH_TAN] = 'MATH_TAN'
Operation.mneumonic[Operation.kind.MATH_ATAN2] = 'MATH_ATAN2'
Operation.mneumonic[Operation.kind.MATH_POW] = 'MATH_POW'
Operation.mneumonic[Operation.kind.MATH_MAX] = 'MATH_MAX'
Operation.mneumonic[Operation.kind.MATH_MIN] = 'MATH_MIN'

//
Operation.mneumonic[Operation.kind.ENTER] = 'ENTER'
Operation.mneumonic[Operation.kind.EXIT] = 'EXIT'
Operation.mneumonic[Operation.kind.EXC] = 'EXC'
