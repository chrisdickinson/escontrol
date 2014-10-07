'use strict'

module.exports = CFGFactory

var SharedFunctionInfo = require('./lib/values/shared-function-info.js')
var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var createValueStack = require('./value-stack.js')
var createScopeStack = require('./scope-stack.js')
var createBlockStack = require('./block-stack.js')
var createCallStack = require('./call-stack.js')
var makeBuiltins = require('./builtins.js')
var Operation = require('./operation.js')
var makeRuntime = require('./runtime.js')
var simplify = require('./simplify.js')
var estraverse = require('estraverse')
var graphviz

function CFGFactory(node, opts) {
  if (!(this instanceof CFGFactory)) {
    return new CFGFactory(node)
  }

  opts = opts || {}
  this.onunknown = opts.onunknown || noop
  this.onvisit = opts.onvisit || noop
  this.oncall = opts.oncall || noop
  this.onfunction = opts.onfunction || noop
  this._visit = opts.visit ? this._listenvisit : this._basevisit
  this._stack = []
  this._graphs = []
  this._lastNode = null
  this._builtins = makeBuiltins()
  this._global = new ObjectValue(this._builtins, hidden.initial.GLOBAL, null)
  this._valueStack = createValueStack(this._builtins, opts.onvalue, opts.onpopvalue)
  makeRuntime(this._builtins, this._global)
  this._blockStack = null
  this._blockStacks = []
  this._pushBlockStack()
  this._scopeStack = createScopeStack(this._global, this._builtins)
  this._callStack = createCallStack()
  this._connectionKind = []
  this._edges = []
  this._labels = []

  this._branchID = 1

  this._blockStack.pushState(node, [], true)
  this._callStack.pushFrame(null, this._global, [], false, this._blockStack.current())
  this._pushFrame(this._visit, node)
  this._initSharedFunctionInfo()
}

var cons = CFGFactory
var proto = cons.prototype

proto.global = function() {
  return this._global
}

proto.stackInfo = function() {
  return this._stack.map(function(xs) {
    return xs.fn.name
  }).join('/')
}

proto._pushBlockStack = function() {
  this._blockStack = createBlockStack()
  this._blockStacks.push(this._blockStack)
}

proto._popBlockStack = function() {
  this._blockStacks.pop()
  this._blockStack = this._blockStacks[this._blockStacks.length - 1]
}

proto.advance = function cfg_next() {
  if (this._stack.length) {
    var frame = this._stack.pop()

    frame.fn.call(this, frame.context)

    if (this._stack.length === 0) {
      // filter out unreachable nodes
      this._edges = this._edges.filter(function(xs) {
        return !xs.unreachable
      })

      this._edges = simplify(this._edges)
    }

    return this._stack.length
  }
  return null
}

proto.edges = function() {
  return this._edges.slice()
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

proto._setBackedge = function() {
  this._connectionKind.push('back-edge')
}

proto.setNormal = function() {
  this._connectionKind.push('normal')
}

proto._branchOpen = function() {
  var id = this._branchID++
  this._scopeStack.pushBranch(id)
  return id
}

proto._branchEnd = function(id) {
  this._valueStack._values = this._valueStack._values.map(function(lhs) {
    return lhs && lhs.unwrap && lhs.branchNumber === id ? lhs.unwrap() : lhs
  })
  this._scopeStack.pop()
}

proto._connect = function(from, to, retainValue) {
  if (!from) {
    this._lastNode = to
    return
  }

  // something something something
  // edges will encode:
  //  * value/type flow ??
  //  * conditional flow
  //  * exceptional flow
  var val = this._valueStack.current()
  var edge = {
    kind: this._connectionKind.pop() || 'normal',
    value: retainValue ? (val && val.unwrap ? val.unwrap() : val) : null,
    from: from,
    to: to,
    unreachable: false
  }

  from.send(edge)
  to.receive(edge)

  edge.unreachable = from._isUnreachable
  this._edges.push(edge)
  this._lastNode = to
}

proto._pushFrame = function(fn, context, isLValue, isCallee) {
  this._stack.push(new Frame(fn, context, Boolean(isLValue), Boolean(isCallee), this._blockStack.current()))
}

proto._pushBlock = function cfg_pushBlock(node, hasException, finalizerNode) {
  this._blockStack.pushState(node, this._labels, hasException, finalizerNode)
  this._labels.length = 0

  var current = this._blockStack.current()

  var last = this.last()

  if (current.exception) {
    this._connect(this._createUnreachable(), current.exception)
    this._setLastNode(last)
  }


  if (!FUNCTIONS[node.type]) {
    this._connect(this.last(), current.enter)
  }

  return current
}

proto._popBlock = function() {
  return this._blockStack.pop()
}

proto._isLValue = function() {
  return this._stack[this._stack.length - 1].isLValue
}

proto._isCallee = function() {
  return this._stack[this._stack.length - 1].isCallee
}

proto._popValue = function(as) {
  var val = this._valueStack.pop()

  return new Operation(
    as || Operation.kind.POP,
    null,
    null,
    null
  )
}

proto._createArrayNode = function(len) {
  this._valueStack.toArray(len)

  return new Operation(
    Operation.kind.LOAD_LITERAL_ARRAY,
    len,
    null,
    null
  )
}

proto._createObjectNode = function(len) {
  this._valueStack.toObject(len)
  return new Operation(
    Operation.kind.LOAD_LITERAL_OBJECT,
    len,
    null,
    null
  )
}

proto._createUnreachable = function() {
  return new Operation(
    Operation.kind.UNREACHABLE,
    null,
    null,
    null
  )
}

proto._setLastNode = function(node) {
  this._lastNode = node
}

// TODO: handle callstack
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

proto._listenvisit = function(node) {
  this.onvisit(node)
  return this._basevisit(node)
}

proto._basevisit = function cfg_visit(node) {
  var target = null
  switch(node.type) {
    case 'Identifier': target = this.visitIdentifier; break
    case 'MemberExpression': target = this.visitMemberExpression; break
    case 'Literal': target = this.visitLiteral; break
    case 'CallExpression': target = this.visitCallExpression; break
    case 'BlockStatement': target = this.visitBlock; break
    case 'ExpressionStatement': target = this.visitExpressionStatement; break
    case 'AssignmentExpression': target = this.visitAssignmentExpression; break
    case 'BinaryExpression': target = this.visitBinaryExpression; break
    case 'VariableDeclaration': target = this.visitVariableDeclaration; break
    case 'LogicalExpression': target = this.visitLogicalExpression; break
    case 'IfStatement': target = this.visitIfStatement; break
    case 'ReturnStatement': target = this.visitReturnStatement; break
    case 'FunctionExpression': target = this.visitFunctionExpression; break
    case 'UnaryExpression': target = this.visitUnaryExpression; break
    case 'ThisExpression': target = this.visitThisExpression; break
    case 'ConditionalExpression': target = this.visitConditionalExpression; break
    case 'ObjectExpression': target = this.visitObjectExpression; break
    case 'ArrayExpression': target = this.visitArrayExpression; break
    case 'UpdateExpression': target = this.visitUpdateExpression; break
    case 'WhileStatement': target = this.visitWhileStatement; break
    case 'ForStatement': target = this.visitForStatement; break
    case 'NewExpression': target = this.visitNewExpression; break
    case 'ForInStatement': target = this.visitForInStatement; break
    case 'TryStatement': target = this.visitTryStatement; break
    case 'BreakStatement': target = this.visitBreakStatement; break
    case 'ContinueStatement': target = this.visitContinueStatement; break
    case 'ThrowStatement': target = this.visitThrowStatement; break
    case 'SwitchStatement': target = this.visitSwitchStatement; break
    case 'DoWhileStatement': target = this.visitDoWhileStatement; break
    case 'Program': target = this.visitProgram; break
    case 'SequenceExpression': target = this.visitSequenceExpression; break
    case 'FunctionDeclaration':
    case 'DebuggerStatement':
    case 'EmptyStatement': target = this.visitEmpty; break
    case 'LabeledStatement': target = this.visitLabeledStatement; break
    default: target = this.visitUnknown; break
  }

  this._pushFrame(target, node)
}

proto.visitUnknown = function(node) {
  throw new Error('unrecognized: ' + node.type)
}

proto.visitLabeledStatement = function(node) {
  this._labels.push(node.label.name)
  this._visit(node.body)
}

proto.visitEmpty = function() {

}

var FUNCTIONS = {
    'FunctionDeclaration': true
  , 'FunctionExpression': true
  , 'ArrowExpression': true
}

var hasMap = typeof Map !== 'undefined'

proto._initSharedFunctionInfo = hasMap ?
function() {
  this._sharedFunctionInfo = new Map()
} : function() {
  this._sharedFunctionInfoNodes = []
  this._sharedFunctionInfo = []
}

proto._getSharedFunctionInfo = hasMap ? function(node) {
  var sfi = this._sharedFunctionInfo.get(node)
  if (!sfi) {
    sfi = new SharedFunctionInfo(node)
    this._sharedFunctionInfo.set(node, sfi)
  }

  return sfi
} : function(node) {
  var idx = this._sharedFunctionInfoNodes.indexOf(node)

  // XXX: replace with Map()
  if (idx === -1) {
    this._sharedFunctionInfoNodes.push(node)
    idx = this._sharedFunctionInfo.push(new SharedFunctionInfo(node)) - 1
  }

  return this._sharedFunctionInfo[idx]
}

proto._hoist = function cfg_hoist(inputNode) {
  var self = this
  var items = []

  var sfi = this._getSharedFunctionInfo(inputNode)

  if (sfi) {
    sfi.contributeToContext(this)
    return
  }

  estraverse.traverse(inputNode, {enter: enter})

  // this is a two step process -- we want to have
  // already declared all of the hoisted names before
  // visiting the function body.
  for (var i = 0, len = items.length; i < len; ++i) {
    var name = this._scopeStack.getprop(items[i].id.name)
    name.assign(this.visitFunctionExpression(items[i]))
    this._connect(this.last(), new Operation(Operation.kind.STORE_VALUE, items[i].id.name, null, null))
    this._connect(this.last(), this._popValue())
  }

  function enter(node, parent) {
    if (node.type === 'VariableDeclaration' && node.kind === 'var') {
      self._hoistVariableDeclaration(node)
    } else if (node.type === 'FunctionDeclaration' && node !== inputNode) {
      self._scopeStack.newprop(node.id.name, 'var')
      items.push(node)
    }
    
    if (FUNCTIONS[node.type] && node !== inputNode) {
      this.skip()
    }
  }
}

proto._hoistVariableDeclaration = function(node) {
  for(var i = 0, len = node.declarations.length; i < len; ++i) {
    this._scopeStack.newprop(node.declarations[i].id.name, node.kind)
  }
}

proto._currentCallFrame = function() {
  return this._callStack.current()
}

proto._getEdgesTo = function(node) {
  var out = []
  for(var i = 0, len = this._edges.length; i < len; ++i) {
    if (this._edges[i].to === node) {
      out.push(this._edges[i])
    }
  }
  return out
}

proto._unwind = function() {
  var frame

  for (var i = this._stack.length - 1; i > -1; --i) {
    frame = this._stack[i]
    if (frame.fn.unwindTarget) {
      break
    }
  }

  if (i === -1) {
    throw new Error('unwound too much')
  }

  this._stack.splice(i + 1, this._stack.length - 1)

  while(this._blockStack.current() !== frame.block) {
    this._blockStack.pop()
  }
}

proto.toDot = function() {
  graphviz = graphviz || require('./graphviz.js')
  return graphviz(this._edges)
}

function Frame(fn, context, isLValue, isCallee, block) {
  this.fn = fn
  this.block = block
  this.isCallee = isCallee
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
require('./lib/visit-expr-function.js')(proto)
require('./lib/visit-expr-call.js')(proto)
require('./lib/visit-expr-new.js')(proto)

function noop() {

}
