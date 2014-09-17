'use strict'

module.exports = ScopeStack

var ObjectValue = require('./lib/object.js')
var typeOf = require('./lib/types.js')

function ScopeStack(root) {
  if(!(this instanceof ScopeStack)) {
    return new ScopeStack(root)
  }

  this._root = root
  this._current = root
}

var proto = ScopeStack.prototype



proto.push = function(block) {
  this._current = new ObjectValue(typeOf.OBJECT, ObjectValue.HCI_EMPTY, this._current, null)
  this._current._blockType = block.type
  this._root = this._root || this._current
}

proto.pop = function() {
  this._current = this._current._prototype
}

proto.root = function() {
  return this._root
}

proto.declare = function(str, kind) {
  if (kind !== 'VariableDeclaration') {
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
