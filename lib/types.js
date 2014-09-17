'use strict'

module.exports = typeOf

function typeOf(value) {
  if (value === null) {
    return typeOf.NULL
  }

  return {
    'undefined': typeOf.UNDEFINED,
    'object': typeOf.OBJECT,
    'function': typeOf.FUNCTION,
    'string': typeOf.STRING,
    'number': typeOf.NUMBER,
    'boolean': typeOf.BOOLEAN
  }[typeof value]
}

typeOf.ANY = 0x7F
typeOf.UNDEFINED = 0x01
typeOf.NULL = 0x02
typeOf.OBJECT = 0x04
typeOf.FUNCTION = 0x08
typeOf.STRING = 0x10
typeOf.NUMBER = 0x20
typeOf.BOOLEAN = 0x40
typeOf.STATIC = 0x80
