module.exports = ScopeStack

var createName = require('./lib/name.js')

function ScopeStack() {
  if(!(this instanceof ScopeStack)) {
    return new ScopeStack
  }

  this._current = null
}

var proto = ScopeStack.prototype

proto.push = function(block) {
  this._current = new Scope(this._current, block)
}

proto.pop = function() {
  this._current = this._current._parent
}

proto.declare = function(str, kind) {
  if (kind !== 'VariableDeclaration') {
    this._current.declare(name)
  }

  var current = this.current
  var okay = false
  do {
    switch(current._block.type) {
      case 'Program':
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowExpression':
        okay = false
      break
      default:
        okay = true
    }

    if (okay) current = current._parent
  } while(current && okay)

  current.declare(str)
}

proto.lookup = function(str) {
  return this._current.lookup(str)
}

function Scope(parent, block) {
  this._names = {}
  this._parent = parent
  this._block = block
}

var proto = Scope.prototype

proto.declare = function(str) {
  return this._names[str] = createName(str)
}

proto.lookup = function(str) {
  return this._names[str] ||
    (this._parent ? this._parent.lookup(str) : null)
}
