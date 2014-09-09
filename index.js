module.exports = CFGFactory

var createBlockStack = require('./block-stack.js')
var createValueStack = require('./value-stack.js')

function CFGFactory(node) {
  if (!(this instanceof CFGFactory)) {
    return new CFGFactory(node)
  }

  this._stack = []
  this._graphs = []
  this._lastNode = null
  this._valueStack = createValueStack()
  this._blockStack = createBlockStack()
  this._blockStack.pushState(node)
  this._pushFrame(this._visit, node)

  this._nodes = []
  this._edges = []
}

var cons = CFGFactory
var proto = cons.prototype

proto.advance = function cfg_next() {
  if (this._stack.length) {
    var frame = this._stack.pop()

    frame.fn.call(this, frame.context)

    return this._stack.length
  }

  return null
}

proto.last = function() {
  return this._lastNode
}

proto._connect = function(from, to) {
  // something something something
  // edges will encode:
  //  * value/type flow ??
  //  * conditional flow
  //  * exceptional flow
  this._edges.push({
    value: this._valueStack.info(),
    from: from,
    to: to
  })
  // load "x" from "y"
  // create "x"

  this._lastNode = to
}

proto._pushFrame = function(fn, context) {
  this._stack.push(new Frame(fn, context, this._blockStack.current()))
}

proto._pushBlock = function cfg_pushBlock(node) {
  this._blockStack.pushState(node)

  var current = this._blockStack.current()

  this._nodes.push(current.enter)
  this._nodes.push(current.exit)
  this._nodes.push(current.exception)
  this._connect(this.last(), current.enter)

  return current
}

proto._popBlock = function() {
  return this._blockStack.pop()
}

proto._pushValue = function cfg_pushValue(value, isStatic) {
  this._valueStack.push(value, isStatic)
  this._connect(this.last(), {
    operation: 'literal',
    value: this._valueStack.info()
  })
}

proto._popValue = function() {
  var val = this._valueStack.pop()

  // XXX: what do nodes look like?
  return {operation: '(pop)'}
}

proto._createUnreachable = function() {
  return {operation: '(unreachable)'}
}

proto._setLastNode = function(node) {
  this._lastNode = node
}

proto._visit = function cfg_visit(node) {
  switch(node.type) {
    case 'EmptyStatement': return

    case 'Program': return this._pushFrame(this.visitProgram, node)
    case 'BlockStatement': return this._pushFrame(this.visitBlock, node)
    case 'ExpressionStatement': return this._pushFrame(this.visitExpressionStatement, node)
    case 'Literal': return this._pushFrame(this.visitLiteral, node)
    case 'BinaryExpression': return this._pushFrame(this.visitBinaryExpression, node)
    case 'SequenceExpression': return this._pushFrame(this.visitSequenceExpression, node)
  }
}

proto._hoist = function cfg_hoist(node) {

}

function Frame(fn, context, block) {
  this.fn = fn
  this.context = context
  this.block = block
}

require('./lib/visit-stmt-block.js')(proto)
require('./lib/visit-stmt-program.js')(proto)
require('./lib/visit-stmt-expr.js')(proto)
require('./lib/visit-expr-literal.js')(proto)
require('./lib/visit-expr-binary.js')(proto)
require('./lib/visit-expr-sequence.js')(proto)

if(false) {
require('./lib/visit-stmt-function.js')(proto)
require('./lib/visit-stmt-conditional.js')(proto)
require('./lib/visit-stmt-for-of.js')(proto)
require('./lib/visit-stmt-for-in.js')(proto)
require('./lib/visit-stmt-for.js')(proto)
require('./lib/visit-stmt-try.js')(proto)
require('./lib/visit-stmt-while.js')(proto)
require('./lib/visit-stmt-do-while.js')(proto)
require('./lib/visit-stmt-with.js')(proto)
require('./lib/visit-stmt-return.js')(proto)
require('./lib/visit-stmt-break.js')(proto)
require('./lib/visit-stmt-throw.js')(proto)
require('./lib/visit-stmt-continue.js')(proto)
require('./lib/visit-stmt-switch-case.js')(proto)
require('./lib/visit-stmt-switch.js')(proto)
require('./lib/visit-stmt-var-declaration.js')(proto)
}

if(false) {
require('./lib/visit-expr-new.js')(proto)
require('./lib/visit-expr-call.js')(proto)
require('./lib/visit-expr-assignment.js')(proto)
require('./lib/visit-expr-logical.js')(proto)
require('./lib/visit-expr-member.js')(proto)
require('./lib/visit-expr-array.js')(proto)
require('./lib/visit-expr-object.js')(proto)
require('./lib/visit-expr-unary.js')(proto)
require('./lib/visit-expr-identifier.js')(proto)
require('./lib/visit-expr-update.js')(proto)
require('./lib/visit-expr-this.js')(proto)
require('./lib/visit-expr-empty.js')(proto)
}
