'use strict'

module.exports = ScopeStack

var Membrane = require('./lib/values/membrane.js')
var Scope = require('./lib/values/scope.js')

function ScopeStack(makeScope, root) {
  if(!(this instanceof ScopeStack)) {
    return new ScopeStack(makeScope, root)
  }

  this._makeScope = makeScope
  this._membraneMap = new Map()
  this._root = root
  this._current = root
}

var proto = ScopeStack.prototype

proto.current = function() {
  return this._current
}

proto.push = function(block) {
  this._current = this._makeScope(block.type, this._current || null)
}

proto.set = function(scope) {
  this._current = scope
}

proto.pushBranch = function(branchID) {
  this._current = new Membrane(this._current)
  this._membraneMap.set(branchID, this._current)
}

proto.endBranch = function(branchID, stack) {
  var membrane = this._membraneMap.get(branchID)
  if (membrane !== this._current) {
    throw new Error('should not attempt to close membrane')
  }
  this._current = membrane.unwrapAll(stack)
}

proto.pop = function() {
  this._current = this._current._prototype
}

proto.root = function() {
  return this._root
}

proto.newprop = function(str, kind) {
  if (kind === 'imaginary') {
    var current = this._current
    while (current) {
      var blockType = current.getBlockType()
      if (blockType === 'Program' || blockType === '(Branch)') {
        break
      }
      current = current._prototype
    }
    if (!current) {
      throw new Error('out of blocks: ' + str + ' looking for ' + kind)
    }
    return current.newprop(str)
  }

  if (kind !== 'var') {
    return this._current.newprop(str)
  }

  var current = this._current
  var okay = false
  do {
    switch(current.getBlockType()) {
      case 'Program':
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowExpression':
        okay = false
      break
      default:
        okay = true
    }

    if (okay) current = current._prototype
  } while(current && okay)

  return current.newprop(str)
}

proto.getprop = function(str, immediate) {
  return this._current.getprop(str, immediate)
}
