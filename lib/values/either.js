'use strict'

module.exports = Either

var inherits = require('inherits')

var makeUndefined = require('./undefined.js')
var unwrapAll = require('../unwrap-all.js')
var Undefined = require('./undefined.js')
var Unknown = require('./unknown.js')
var BaseValue = require('./base.js')
var Null = require('./null.js')

var ArrayFrom = Array.from || function(iterable) {
  var out = []
  for (let item of iterable) {
    out.push(item)
  }
  return out
}

function Either(itemSet) {
  BaseValue.call(this, null)
  this._outcomes = itemSet
}

inherits(Either, BaseValue)

Either.of = function(/* args */) {
  return Either.from([].slice.call(arguments))
}

Either.from = function(arr) {
  var set = new Set(arr.filter(Boolean))
  if (set.size === 1) {
    return set.values().next().value
  }
  var master = null
  for (var item of set) {
    if (item instanceof Either) {
      set.delete(item)
      if (master) {
        master = item
      } else {
        for (var subitem of item._outcomes) {
          set.add(subitem)
        }
      }
    }
  }

  if (master) {
    for (var item of set) {
      master._outcomes.add(item)
    }
  } else {
    master = new Either(set)
  }

  return master
}

var proto = Either.prototype

proto.getInfo = function() {
  var stack = []
  var current = this
  var leaves = []
  var uniq = []
  var ws = new WeakSet

  do {
    while(current && current instanceof Either) {
      stack.push(current._rhs)
      current = current._lhs
    }
    leaves.push(current)
    if (!ws.has(current)) {
      ws.add(current)
      uniq.push(current)
    }
    current = stack.pop()
  } while(stack.length)
}

proto.getHCID = function() {
  var out = new Set
  for (let item of this._outcomes) {
    out.add(item.getHCID())
  }
  return ArrayFrom(out)
}

proto.getMark = function(key) {
  this._marks = this._marks || {__proto__: null}
  if (key in this._marks) {
    return this._marks[key]
  }

  var out = []
  for (let item of this._outcomes) {
    out.push(item.getMark(key))
  }
  return out.filter(Boolean)
}

proto.setMark = function(key, value) {
  this._marks = this._marks || {__proto__: null}
  this._marks[key] = value
}

proto.classInfo = function() {
  var flat = []

  function recurse(node) {
    if (node instanceof Either) {
      recurse(node._lhs)
      recurse(node._rhs)
    } else {
      var ci = node ? node.classInfo() : '<' + node + '>'

      if (flat.indexOf(ci) === -1) {
        flat.push(ci)
      }
    }
  }

  recurse(this)
  return 'Either<' + flat.join(',\n') + '>'
}

proto.copy = function() {
  return new Either(new Set(ArrayFrom(this._outcomes, function(xs) {
    return xs.copy()
  })))
}

proto.getprop = function Either_getprop(prop, immediate) {
  var mayThrow = false
  for (let item of this._outcomes) {
    if (item.isUndefined() || item.isNull()) {
      mayThrow = true
      break
    }
  }

  return new EitherName(this, prop, mayThrow, immediate)
}

proto.newprop = function Either_newprop(prop, name) {
  if (this._lhs === Undefined() || this._lhs === Null()) {
    if (this._rhs === Undefined() || this._rhs === Null()) {
      throw new Error('lhs: cannot create a new property')
    }

    return this._rhs.newprop(prop)
  }

  if (this._rhs === Undefined() || this._rhs === Null()) {
    if (this._lhs === Undefined() || this._lhs === Null()) {
      throw new Error('rhs, cannot create a new property')
    }

    return this._lhs.newprop(prop)
  }

  var out = this._rhs.newprop(prop, this._lhs.newprop(prop, name))
  out.setCurrentSourceObject(this)
  return out
}

proto.delprop = function Either_delprop(prop) {
  for (var item of this._outcomes) {
    item.delprop(prop)
  }
}

var checks = [
  'isString',
  'isUndefined',
  'isNull',
  'isFunction',
  'isUnknown'
]

checks.forEach(function(check) {
  proto[check] = Function(`
    for (var item of this._outcomes) {
      if (item.${check}()) {
        return true
      }
      return true
    }
  `)
})

proto.call = function(cfg) {
  // TODO: fix Either#call
  console.trace('CALL!')
  cfg._valueStack.push(new Unknown(cfg._builtins))
}

proto.instantiate = function(cfg) {
  // TODO: fix Either#call
  cfg._valueStack.push(new Unknown(cfg._builtins))
}

proto.assumeDefined = function() {
  for (var item of this._outcomes) {
    if (item.assumeDefined) {
      item.assumeDefined()
    }
  }
}

proto.assumeFunction = function() {
  for (var item of this._outcomes) {
    if (item.assumeFunction) {
      item.assumeFunction()
    }
  }
}

function EitherName(from, propName, canThrow, immediate) {
  this._from = from
  this._propName = propName
  this._currentSource = from
  this.canThrow = canThrow
  this._immediate = immediate
}

var proto = EitherName.prototype

proto.getName = function() {
  return this._propName
}

proto.setCurrentSourceObject = function(current) {
  this._currentSource = current
}

proto.getCurrentSourceObject = function() {
  return this._currentSource
}

proto.assign = function(value) {
  for (var item of this._from._outcomes) {
    if (item.isUndefined() || item.isNull()) {
      continue
    }
    var prop = item.getprop(this._propName, true)
    if (!prop) {
      prop = item.newprop(this._propName)
    }
    prop.assign(value)
  }
}

proto.value = function() {
  var out = []
  for (var item of this._from._outcomes) {
    if (item.isUndefined() || item.isNull()) {
      continue
    }
    var prop = item.getprop(this._propName, this._immediate)
    if (prop) {
      out.push(prop.value())
    }
  }
  return Either.from(out)
}
