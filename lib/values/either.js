'use strict'

module.exports = Either

var inherits = require('inherits')

var unwrapAll = require('../unwrap-all.js')
var BaseValue = require('./base.js')
var Name = require('./name.js')

var ArrayFrom = Array.from || function(iterable) {
  var out = []
  for (let item of iterable) {
    out.push(item)
  }
  return out
}

function Either(cfg, itemSet) {
  this._outcomes = itemSet

  // XXX: call BaseValue last because 
  // having _outcomes set up is ++important
  BaseValue.call(this, cfg)
}

inherits(Either, BaseValue)

Either.of = function(cfg/*,  args */) {
  return Either.from(cfg, [].slice.call(arguments, 1))
}

Either.from = function(cfg, arr) {
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
    master = new Either(cfg, set)
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

Object.defineProperty(proto, '_prototype', {
  get: function() {
    var prop = this.getprop('__proto__')
    if (!prop) {
      return null
    }
    return prop.value()
  },
  set: function(v) {
    var prop = this.getprop('__proto__')
    prop.assign(v)
    return v
  }
})

proto.outcomes = function() {
  return this._outcomes.values()
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

  for (var xs of this._outcomes) {
    flat.push(xs.classInfo())
  }
  return 'Either<\n  ' + flat.join(',\n  ') + '\n>'
}

proto.copy = function() {
  return new Either(this.cfg, new Set(ArrayFrom(this._outcomes, function(xs) {
    return xs.copy()
  })))
}

proto.getprop = function Either_getprop(prop, immediate) {
  var mayThrow = false
  var Initial = 1
  var result = Initial
  var same = true
  // XXX: barf unceasingly
  for (let item of this._outcomes) {
    if (item.isUndefined() || item.isNull()) {
      mayThrow = true
      if (!result) {
        same = false
        break
      }
    } else {
      if (result === Initial) {
        result = item.getprop(prop, immediate)
      } else if (result !== item.getprop(prop, immediate)) {
        same = false
      }
    }

    if (!same && mayThrow) break
  }

  if (result === Initial) {
    result = null
  }

  if (same) {
    return result
  }

  return new EitherName(this, prop, mayThrow, immediate)
}

proto.newprop = function Either_newprop(prop, name) {
  name = name || new Name(prop, this, this.cfg)
  for (let outcome of this._outcomes) {
    if (!outcome.isUndefined() && !outcome.isNull()) {
      outcome.newprop(prop, name)
    }
  }

  name.setCurrentSourceObject(this)
  return name
}

proto.delprop = function Either_delprop(prop) {
  for (var item of this._outcomes) {
    if (!item.isUndefined() && !item.isNull()) {
      item.delprop(prop)
    }
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
    }
    return false
  `)
})

proto.call = function(cfg, thisValue, args, isNew) {
  if (this._outcomes.length === 0) {
    return cfg._valueStack.push(cfg.makeUnknown())
  }
  var iter = this._outcomes.values()
  var done = false
  var values = []
  var block = cfg._pushBlock(cfg.lastASTNode())
  return loop()

  function thunk() {
    values.push(cfg._valueStack.pop())
    cfg._connect(cfg.last(), block.exit)
    loop()
  }

  function loop() {
    cfg._setLastNode(block.enter)
    var next = iter.next()
    if (next.done) {
      cfg._popBlock()
      cfg._setLastNode(block.exit)
      return cfg._valueStack.push(Either.from(cfg, values))
    }

    next = next.value
    cfg._pushFrame(thunk)
    if (next.isUnknown()) {
      cfg._valueStack.push(cfg.makeUnknown())
      return
    }

    next = unwrapAll(next)
    if (!next.call) {
      return cfg._valueStack.push(cfg.makeUnknown())
    }
    var recurses = cfg._callStack.isRecursion(next)
    if (recurses) {
      var last = cfg.last()
      cfg._setBackedge()
      cfg._connect(last, recurses.enter ? recurses.enter : cfg._rootBlock().enter)

      // replace the last frame with "loop"
      values.push(cfg.makeUnknown())
      cfg._stack.pop()
      cfg._pushFrame(loop)
      return
    }
    var shouldCall = false !== cfg.oncall(
      next,
      thisValue,
      args,
      false
    )
    if (recurses || !shouldCall) {
      // XXX: backedge isn't drawn correctly!
      return cfg._valueStack.push(cfg.makeUnknown())
    }
    cfg.setEitherCall()
    if (isNew) {
      return next.instantiate(cfg, args)
    }
    next.call(cfg, thisValue, args, isNew, true)
  }
}

proto.instantiate = function(cfg, args) {
  // TODO: fix Either#call
  return this.call(cfg, null, args, true, true)
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

proto.getBlockType = function() {
  // XXX: in the case that a scope gets turned into an either, this should
  // resolve that problem.
  // for now, assume that only the global object can run
  // into this problem (though "with" complicates this.)
  return 'Program'
}

proto.asLookup = function(against) {
  var out = new Set()
  for (const outcome of this.outcomes()) {
    out.add(outcome.asLookup(against))
  }
  return Either.from(this.cfg, out)
}

function EitherName(from, propName, canThrow, immediate) {
  this._from = from
  this._propName = propName
  this._currentSource = from
  this.canThrow = canThrow
  this._immediate = immediate
}

var proto = EitherName.prototype

Object.defineProperty(proto, 'source', {
  get() {
    return this._from
  },
  enumerable: false
})

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
      var value = prop.value()
      if (value) {
        out.push(value)
      }
    }
  }
  if (!out.length) {
    return null
  }
  return Either.from(this._from.cfg, out)
}
