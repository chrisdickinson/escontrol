'use strict'

module.exports = ScopeStack

var WrappedObject = require('./lib/wrapped-object.js')
var ObjectValue = require('./lib/object.js')
var typeOf = require('./lib/types.js')

function ScopeStack(root) {
  if(!(this instanceof ScopeStack)) {
    return new ScopeStack(root)
  }

  this._root = root
  this._current = root
  this._root._blockType = 'Program'
}

var proto = ScopeStack.prototype

proto.current = function() {
  return this._current
}

proto.push = function(block) {
  this._current = new ObjectValue(typeOf.OBJECT, ObjectValue.HCI_EMPTY, this._current, null)
  this._current._blockType = block.type
  this._root = this._root || this._current
}

proto.pushBranch = function(branchID) {
  this._current = new WrappedObject(this._current, branchID, this._current)
  this._current._blockType = '(Branch)'
}

proto.pop = function() {
  this._current = this._current._prototype
}

proto.root = function() {
  return this._root
}

proto.declare = function(str, kind) {
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
    return current.declare(str)
  }

  if (kind !== 'var') {
    return this._current.declare(str)
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

  return current.declare(str)
}

proto.lookup = function(str, immediate) {
  return this._current.lookup(str, immediate)
}
