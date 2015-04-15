'use strict'

module.exports = ScopeStack

var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var Membrane = require('./lib/values/membrane.js')

function ScopeStack(root, builtins) {
  if(!(this instanceof ScopeStack)) {
    return new ScopeStack(root, builtins)
  }

  this._membraneMap = new Map()
  this._root = root
  this._current = root
  this._root._blockType = 'Program'
  this._builtins = builtins
}

var proto = ScopeStack.prototype

proto.current = function() {
  return this._current
}

proto.push = function(block) {
  this._current = new ObjectValue(this._builtins, hidden.initial.EMPTY, this._current)
  this._current._blockType = block.type
  this._root = this._root || this._current
}

proto.pushBranch = function(branchID) {
  this._current = new Membrane(this._current)
  if (this._membraneMap.has(branchID)) {
    throw new Error('scope stack does not have branch id #' + branchID)
  }
  this._membraneMap.set(branchID, this._current)
  this._current._blockType = '(Branch)'
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
      if (current._blockType === '(Branch)' || current._blockType === 'Program') {
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
    switch(current._blockType) {
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
