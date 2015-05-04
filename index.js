'use strict'

module.exports = CFGFactory

var SharedFunctionInfo = require('./lib/values/shared-function-info.js')
var makeUndefined = require('./lib/values/undefined.js')
var FunctionValue = require('./lib/values/function.js')
var hidden = require('./lib/values/hidden-class.js')
var ObjectValue = require('./lib/values/object.js')
var createValueStack = require('./value-stack.js')
var createScopeStack = require('./scope-stack.js')
var createCallStack = require('./call-stack.js')
var Unknown = require('./lib/values/unknown.js')
var makeRuntime = require('./runtime/index.js')
var makeNull = require('./lib/values/null.js')
var Scope = require('./lib/values/scope.js')
var Value = require('./lib/values/value.js')
var makeBuiltins = require('./builtins.js')
var Name = require('./lib/values/name.js')
var Operation = require('./operation.js')
var simplify = require('./simplify.js')
var graphviz

function CFGFactory(node, opts) {
  if (!(this instanceof CFGFactory)) {
    return new CFGFactory(node, opts)
  }

  opts = opts || {}
  this.operationId = 0
  this.onunknown = opts.onunknown || noop
  this.onvisit = opts.onvisit || noop
  this.oncall = opts.oncall || noop
  this.oncalled = opts.oncalled || noop
  this.onoperation = opts.onoperation || noop
  this.onfunction = opts.onfunction || noop
  this.onvalue = opts.onvalue || noop
  this.onpopvalue = opts.onpopvalue || noop
  this.onload = opts.onload || noop
  this._visit = opts.onvisit ? this._listenvisit : this._basevisit
  this._stack = []
  this._graphs = []
  this._lastNode = null
  this._builtins = opts.builtins || makeBuiltins(this)
  this._global = new Name('[[Global]]')
  this._global.assign(opts.global || this.makeScope('Program', null))
  this._valueStack = createValueStack(this)
  if (!opts.global) makeRuntime(this, this._global.value())
  this._scopeStack = createScopeStack(this.makeScope.bind(this), this._global.value())
  this._callStack = createCallStack()
  this._connectionKind = []
  this._edges = []
  this._labels = []

  this._branchID = 1

  this._callStack.pushFrame(null, this.global(), [], false, null)
  this._pushFrame(this._visit, node)
  this._pushBlock(node, true, null)
  this._sharedFunctionInfo = new Map()

  this._lastASTNode = null
}

var cons = CFGFactory
var proto = cons.prototype

proto.global = function() {
  return this._scopeStack.root()//this._global.value()
}

proto.builtins = function() {
  return this._builtins
}

proto._isStrict = function() {
  var frame = this._callStack.current()
  var func = frame.getFunction()

  // XXX: this isn't quite correct, since
  // the top level frame may not have a function
  // but may still be "use strict"
  if (!func) {
    return false
  }

  return func.isStrict()
}

proto.stackInfo = function() {
  return this._stack.map(function(xs) {
    return xs.fn.name
  }).join('/')
}

proto.getExceptionDestination = function() {
  var frame = this._callStack.current()
  while (frame) {
    var stack = frame.getStack()
    var current = stack.current()
    do {
      if (current.exception && !/Function/.test(current.type)) {
        return {
          frame: frame,
          block: current
        }
      }
      current = current.parent()
    } while (current)
    frame = frame.parent
  }
  return null
}

proto.advance = function cfg_next() {
  Operation.id = this.operationId
  if (this._stack.length) {
    var frame = this._stack.pop()
    frame.fn.call(this, frame.context)
    this.operationId = Operation.id
    return this._stack.length
  }
  this.operationId = Operation.id
  return null
}

proto.simplify = function() {
  return simplify(this._edges.filter(function(xs) {
    return !xs.unreachable
  }))
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

proto.setEitherCall = function() {
  this._connectionKind.push('either-call')
}

proto._branchOpen = function() {
  var id = this._branchID++
  this._scopeStack.pushBranch(id)
  return id
}

proto._branchEnd = function(id) {
  this._scopeStack.endBranch(id, this._valueStack._values)
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
  this._stack.push(new Frame(fn, context, Boolean(isLValue), Boolean(isCallee), this._currentBlock()))
}

proto._pushBlock = function cfg_pushBlock(node, hasException, finalizerNode) {
  var blockStack = this._callStack.current().getStack()
  blockStack.pushState(node, this._labels, hasException, finalizerNode)
  this._labels.length = 0

  var current = blockStack.current()

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
  return this._callStack.current().getStack().pop()
}

proto._currentBlock = function() {
  return this._callStack.current().getStack().current()
}

proto._rootBlock = function() {
  return this._callStack.current().getStack().root()
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

proto._throwException = function(exc) {
  var oldLast = this.last()
  var frame = this._callStack.current()

  if (typeof exc === 'string') {
    var prop = this._builtins.getprop('[[' + exc + ']]')
    if (!prop) {
      throw new Error('unknown built in error type: ' + exc)
    }
    prop = prop.value()
    if (!prop) {
      throw new Error('error type ' + exc + ' has no value')
    }
    exc = prop.makeNew()
  }

  while (frame) {
    var blockStack = frame.getStack()
    var current = blockStack.current()
    while (current) {
      if (current.exception) {
        break
      }

      current = current.parent()
    }
    if (current) {
      break
    }
    frame = frame.parent
  }

  if (!current) {
    throw new Error('ran out of blocks!')
  }

  this._setException()
  this._connect(oldLast, current.exception)
  this._setLastNode(oldLast)
}

proto.lastASTNode = function() {
  return this._lastASTNode
}

proto._listenvisit = function(node) {
  this.onvisit(node)
  return this._basevisit(node)
}

proto._basevisit = function cfg_visit(node) {
  var target = null
  this._lastASTNode = node
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
    case 'TaggedTemplateExpression':
        target = this.visitTaggedTemplateLiteral; break
    case 'TemplateLiteral': target = this.visitTemplateLiteral; break
    case 'TemplateElement': target = this.visitTemplateElement; break
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

proto._getSharedFunctionInfo = function(node) {
  var sfi = this._sharedFunctionInfo.get(node)
  if (!sfi) {
    sfi = new SharedFunctionInfo(node)
    this._sharedFunctionInfo.set(node, sfi)
  }
  return sfi
}

proto._hoist = function cfg_hoist(inputNode) {
  var self = this
  var items = []

  var sfi = this._getSharedFunctionInfo(inputNode)
  sfi.contributeToContext(this)
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

proto.toDot = function() {
  graphviz = graphviz || require('./graphviz.js')
  return graphviz(simplify(this._edges))
}

proto.makeObject = function(hci, proto) {
  return new ObjectValue(
    this,
    hci || hidden.initial.EMPTY,
    typeof proto === 'string' ? this._builtins.getprop(proto).value() :
    typeof proto === 'object' ? proto :
    this._builtins.getprop('[[ObjectProto]]').value()
  )
}

proto.makeArray = function(size) {
  var arr = this._builtins.getprop('[[ArrayConstructor]]').value().makeNew()
  arr.newprop('length').assign(this.makeValue('number', size))
  return arr
}

proto.makeFunction = function(callFn, instantiateFn, prototype, node, scope) {
  node = node || {type: 'FunctionExpression', phony: true, body: {type: 'BlockStatement', body: []}, params: []}
  var sfi = this._getSharedFunctionInfo(node)
  var value = new FunctionValue(
    this,
    node || {},
    prototype || this.makeObject(),
    node && node.id && node.id.name ? node.id.name :
    callFn && callFn.name ? callFn.name :
    instantiateFn && instantiateFn.name ? instantiateFn.name : '<anon>',
    scope || this.global(),
    sfi,
    null,
    null
  )
  if (callFn) value.call = callFn
  if (instantiateFn || callFn) value.instantiateFn = instantiateFn || callFn
  return value
}

proto.makeValue = function(kind, value) {
  return new Value(this, kind, value)
}

proto.makeUnknown = function() {
  return new Unknown(this._builtins)
}

proto.makeUndefined = function() {
  return makeUndefined()
}

proto.makeNull = function() {
  return makeNull()
}

proto.makeRegExp = function(src, flags) {
  return this.makeObject(
    hidden.initial.REGEXP,
    this._builtins.getprop('[[RegExpProto]]').value()
  )
}

proto.makeScope = function(name, parent) {
  return new Scope(this._builtins, parent, name)
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
require('./lib/visit-expr-tpl-literal.js')(proto)

function noop() {

}
