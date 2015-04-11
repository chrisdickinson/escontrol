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
    var unwrappedItem = unwrapAll(item)
    if (unwrappedItem instanceof Either) {
      set.delete(item)
      if (master) {
        master = unwrappedItem
      } else {
        for (var subitem of unwrappedItem._outcomes) {
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

  // make sure outcomes cannot contain master
  for (var xs of master._outcomes) {
    if (unwrapAll(xs) === master) {
      master._outcomes.delete(xs)
    }
  }
  return master
}

var proto = Either.prototype

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

  for (var xs of this._outcomes) {
    flat.push(xs.classInfo())
  }
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
  // 'isUnknown'
]

proto.isUnknown = function() {
  for (var item of this._outcomes) {
    if (!item.isUnknown()) {
      return false
    }
  }
  return true
}

proto.isEither = function() {
  return true
}

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

proto.call = function(cfg, thisValue, args, isNew) {
  // TODO: fix Either#call
  cfg._valueStack.push(cfg.makeUnknown())
  return

  var iter = this._outcomes.values()
  var done = false
  var values = []
  cfg._valueStack.push(cfg.makeUnknown())
  return loop()

  function loop() {
    values.push(cfg._valueStack.pop())
    var next = iter.next()
    if (next.done) {
      values.shift()
      return cfg._valueStack.push(Either.from(values))
    }

    next = next.value
    cfg._pushFrame(loop)
    if (next.isUnknown()) {
      cfg._valueStack.push(cfg.makeUnknown())
      return loop()
    }
    if (!next.call) {
      return cfg._valueStack.push(cfg.makeUnknown())
    }
    next.call(cfg, thisValue, args, isNew)
  }
}

proto.instantiate = function(cfg) {
  // TODO: fix Either#call
  cfg._valueStack.push(cfg.makeUnknown())
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
