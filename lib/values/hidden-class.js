module.exports = {
  advance: advance,
  get: get,
  reserve: reserve,
  initial: {
    EXPANDO: -1,
    NUMBER: 0,
    ARRAY: 1,
    REGEXP: 2,
    FUNCTION: 3,
    STRING: 4,
    BOOLEAN: 5,
    UNKNOWN: 6,
    EMPTY: 7,
    ARGUMENTS: 8,
    NULL: 9,
    UNDEFINED: 10,
    GLOBAL: 11
  }
}

var hiddenClasses = [
  new HiddenClass('Number'),
  new HiddenClass('Array'),
  new HiddenClass('RegExp'),
  new HiddenClass('Function'),
  new HiddenClass('String'),
  new HiddenClass('Boolean'),
  new HiddenClass('Unknown'),
  new HiddenClass('Object'),
  new HiddenClass('Arguments'),
  new HiddenClass('Null'),
  new HiddenClass('Undefined'),
  new HiddenClass('Global')
]

function HiddenClass(strName, prev) {
  this._name = strName || null
  this._prev = prev || null
  this._edges = {__proto__: null}
}

HiddenClass.prototype.advance = function(prop, hci) {
  var next = this._edges[prop]

  if (next === undefined) {
    next = hiddenClasses.push(new HiddenClass(prop, hci)) - 1
    this._edges[prop] = next
  }

  return next
}

HiddenClass.prototype.toName = function() {
  var current = this
  var attrs = []

  while (current) {
    attrs.unshift(current._name)
    current = hiddenClasses[current._prev]
  }

  var name = attrs.shift()

  return name + ':{' + attrs.join(', ') + '}'
}

function reserve(name) {
  var hci = hiddenClasses.length

  hiddenClasses.push(new HiddenClass(name, null))

  return hci
}

function advance(hci, prop) {
  return get(hci).advance(prop, hci)
}

function get(hci) {
  return hiddenClasses[hci]
}
