module.exports = CFGFactory

var createBlockStack = require('./block-stack.js')
var createValueStack = require('./value-stack.js')
var createScopeStack = require('./scope-stack.js')
var createCallStack = require('./call-stack.js')
var ObjectValue = require('./lib/object.js')
var typeOf = require('./lib/types.js')

var estraverse = require('estraverse')

function CFGFactory(node) {
  if (!(this instanceof CFGFactory)) {
    return new CFGFactory(node)
  }

  this._stack = []
  this._graphs = []
  this._lastNode = null
  this._global = new ObjectValue(typeOf.OBJECT, ObjectValue.HCI_EMPTY)
  this._valueStack = createValueStack()
  this._blockStack = createBlockStack()
  this._scopeStack = createScopeStack(this._global)
  this._callStack = createCallStack()
  this._connectionKind = []
  this._nodes = []
  this._edges = []
  this._labels = []

  this._blockStack.pushState(node, [], true)
  this._scopeStack.push(this._blockStack.current())
  this._callStack.pushFrame(this._global, [], false, this._blockStack.current())
  this._pushFrame(this._visit, node)
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

// connection modes
proto._setIfTrue = function() {
  this._connectionKind.push('if-true')
}

proto._setIfFalse = function() {
  this._connectionKind.push('if-false')
}

proto._setException = function() {
  this._connectionKind.push('exception')
}

proto.setNormal = function() {
  this._connectionKind.push('normal')
}

proto._connect = function(from, to) {
  // something something something
  // edges will encode:
  //  * value/type flow ??
  //  * conditional flow
  //  * exceptional flow
  this._edges.push({
    kind: this._connectionKind.pop() || 'normal',
    value: this._valueStack.current(),
    from: from,
    to: to,
  })
  // load "x" from "y"
  // create "x"

  this._lastNode = to
}

proto._pushFrame = function(fn, context, isLValue) {
  this._stack.push(new Frame(fn, context, Boolean(isLValue)))
}

proto._pushBlock = function cfg_pushBlock(node, hasException, finalizerNode) {
  this._blockStack.pushState(node, this._labels, hasException, finalizerNode)
  this._labels.length = 0

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

proto._isLValue = function() {
  return this._stack[this._stack.length - 1].isLValue
}

proto._pushValue = function cfg_pushValue(value, isStatic, fromName) {
  this._valueStack.push(value, isStatic)
  this._connect(this.last(), {
    operation: fromName ? 'load' : 'literal',
    name: fromName ? fromName : null,
    value: this._valueStack.current()
  })
}

proto._popValue = function() {
  var val = this._valueStack.pop()

  // XXX: what do nodes look like?
  return {operation: '(pop)', value: val}
}

proto._createArrayNode = function(len) {
  this._valueStack.toArray(len)
  return {operation: '(array)', size: len}
}

proto._createObjectNode = function(len) {
  this._valueStack.toObject(len)
  return {operation: '(object)', size: len}
}

proto._createUnreachable = function() {
  return {operation: '(unreachable)'}
}

proto._setLastNode = function(node) {
  this._lastNode = node
}

proto._throwException = function(typeName) {
  var oldLast = this.last()
  var current = this._blockStack.current()

  while (current) {
    if (current.exception) {
      break
    }

    current = current.parent()
  }

  if (!current) {
    throw new Error('ran out of blocks!')
  }

  this._setException()
  this._connect(oldLast, current.exception)
  this._setLastNode(oldLast)

}

proto._visit = function cfg_visit(node) {
  switch(node.type) {
    case 'DebuggerStatement':
    case 'EmptyStatement': return
    case 'LabeledStatement':
      this._labels.push(node.label.name)
      this._visit(node.body)

    return
    case 'Program': return this._pushFrame(this.visitProgram, node)
    case 'BlockStatement': return this._pushFrame(this.visitBlock, node)
    case 'ExpressionStatement': return this._pushFrame(this.visitExpressionStatement, node)
    case 'Literal': return this._pushFrame(this.visitLiteral, node)
    case 'Identifier': return this._pushFrame(this.visitIdentifier, node)
    case 'BinaryExpression': return this._pushFrame(this.visitBinaryExpression, node)
    case 'SequenceExpression': return this._pushFrame(this.visitSequenceExpression, node)
    case 'ConditionalExpression': return this._pushFrame(this.visitConditionalExpression, node)
    case 'IfStatement': return this._pushFrame(this.visitIfStatement, node)
    case 'LogicalExpression': return this._pushFrame(this.visitLogicalExpression, node)
    case 'ForStatement': return this._pushFrame(this.visitForStatement, node)
    case 'ForInStatement': return this._pushFrame(this.visitForInStatement, node)
    case 'WhileStatement': return this._pushFrame(this.visitWhileStatement, node)
    case 'DoWhileStatement': return this._pushFrame(this.visitDoWhileStatement, node)
    case 'BreakStatement': return this._pushFrame(this.visitBreakStatement, node)
    case 'ContinueStatement': return this._pushFrame(this.visitContinueStatement, node)
    case 'SwitchStatement': return this._pushFrame(this.visitSwitchStatement, node)
    case 'ThisExpression': return this._pushFrame(this.visitThisExpression, node)
    case 'ArrayExpression': return this._pushFrame(this.visitArrayExpression, node)
    case 'ObjectExpression': return this._pushFrame(this.visitObjectExpression, node)
    case 'UnaryExpression': return this._pushFrame(this.visitUnaryExpression, node)
    case 'MemberExpression': return this._pushFrame(this.visitMemberExpression, node)
    case 'UpdateExpression': return this._pushFrame(this.visitUpdateExpression, node)
    case 'ReturnStatement': return this._pushFrame(this.visitReturnStatement, node)
    case 'ThrowStatement': return this._pushFrame(this.visitThrowStatement, node)
    case 'AssignmentExpression': return this._pushFrame(this.visitAssignmentExpression, node)
    case 'TryStatement': return this._pushFrame(this.visitTryStatement, node)
    case 'VariableDeclaration': return this._pushFrame(this.visitVariableDeclaration, node)
  }
}

var FUNCTIONS = {
    'FunctionDeclaration': true
  , 'FunctionExpression': true
  , 'ArrowExpression': true
}

proto._hoist = function cfg_hoist(node) {
  var self = this

  estraverse.traverse(node, {enter: enter})

  function enter(node, parent) {
    if (node.type === 'VariableDeclaration') {
      self._hoistVariableDeclaration(node)
    } else if (node.type === 'FunctionDeclaration') {
      self._hoistFunctionDeclaration(node)
    } else if (FUNCTIONS[node.type] && node !== inputNode) {
      this.skip()
    }
  }
}

proto._hoistFunctionDeclaration = function(node) {
  this._scopeStack.declare(node.declarations[i].id.name, 'var')
  this._scopeStack.lookup(node.declarations[i].id.name).assign(
    new ObjectValue(typeOf.FUNCTION, ObjectValue.HCI_FUNCTION, codegen)
  )

  function codegen() {
  }
}

proto._hoistVariableDeclaration = function(node) {
  for(var i = 0, len = node.declarations.length; i < len; ++i) {
    this._scopeStack.declare(node.declarations[i].id.name, node.kind)
  }
}

proto._currentCallFrame = function() {
  return this._callStack.current()
}

function Frame(fn, context, isLValue) {
  this.fn = fn
  this.context = context
  this.isLValue = isLValue
}

require('./lib/visit-expr-array.js')(proto)
require('./lib/visit-expr-assignment.js')(proto)
require('./lib/visit-expr-binary.js')(proto)
require('./lib/visit-expr-identifier.js')(proto)
require('./lib/visit-expr-literal.js')(proto)
require('./lib/visit-expr-logical.js')(proto)
require('./lib/visit-expr-member.js')(proto)
require('./lib/visit-expr-object.js')(proto)
require('./lib/visit-expr-sequence.js')(proto)
require('./lib/visit-expr-unary.js')(proto)
require('./lib/visit-stmt-block.js')(proto)
require('./lib/visit-stmt-break.js')(proto)
require('./lib/visit-expr-conditional.js')(proto)
require('./lib/visit-stmt-if.js')(proto)
require('./lib/visit-stmt-continue.js')(proto)
require('./lib/visit-stmt-do-while.js')(proto)
require('./lib/visit-stmt-expr.js')(proto)
require('./lib/visit-stmt-for.js')(proto)
require('./lib/visit-stmt-program.js')(proto)
require('./lib/visit-stmt-return.js')(proto)
require('./lib/visit-stmt-switch.js')(proto)
require('./lib/visit-stmt-throw.js')(proto)
require('./lib/visit-stmt-try.js')(proto)
require('./lib/visit-stmt-while.js')(proto)
require('./lib/visit-stmt-var-declaration.js')(proto)
require('./lib/visit-stmt-for-in.js')(proto)
require('./lib/visit-expr-this.js')(proto)
require('./lib/visit-expr-update.js')(proto)

if(false) {
require('./lib/visit-stmt-function.js')(proto)
require('./lib/visit-stmt-for-of.js')(proto)
require('./lib/visit-stmt-with.js')(proto)
}

if(false) {
require('./lib/visit-expr-new.js')(proto)
require('./lib/visit-expr-call.js')(proto)
}
