module.exports = ScopeStack

var createName = require('./lib/name.js')

function ScopeStack() {
  if(!(this instanceof ScopeStack)) {
    return new ScopeStack
  }

  this._current = null
}

var proto = ScopeStack.prototype

proto.push = function() {
  this._current = new Scope(this._current)
}

proto.pop = function() {
  this._current = this._current._parent
}

proto.declare = function(str) {
  this._current.declare(name)
}

proto.lookup = function(str) {
  return this._current.lookup(str)
}

function Scope(parent) {
  this._names = {}
  this._parent = parent
}

var proto = Scope.prototype

proto.declare = function(str) {
  return this._names[str] = createName(str)
}

proto.lookup = function(str) {
  return this._names[str] ||
    (this._parent ? this._parent.lookup(str) : null)
}
