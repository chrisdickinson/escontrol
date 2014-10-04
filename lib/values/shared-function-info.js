module.exports = SharedFunctionInfo

var Operation = require('../../operation.js')
var estraverse = require('estraverse')

function SharedFunctionInfo(node) {
  this._node = node
  this._hoistedVariables = []
  this._hoistedFunctions = []
  this._returnedWith = []
  this._calledWith = []

  this._instantiatedTimes = 0

  _collectSharedInfo(this, node)
}

var proto = SharedFunctionInfo.prototype

proto.recordCall = function SharedFunctionInfo_recordCall(thisValue, args, isNew) {
  
}

proto.recordReturn = function SharedFunctionInfo_recordReturn(result) {

}

proto.contributeToContext = function SharedFunctionInfo_contributeToContext(cfg) {
  for (var i = 0, len = this._hoistedVariables.length; i < len; ++i) {
    cfg._scopeStack.newprop(this._hoistedVariables[i], 'var')
  }

  for(var i = 0, len = this._hoistedFunctions.length; i < len; ++i) {
    cfg._scopeStack.newprop(this._hoistedFunctions[i].id.name)
  }

  for(var i = 0, len = this._hoistedFunctions.length; i < len; ++i) {
    var name = cfg._scopeStack.getprop(this._hoistedFunctions[i].id.name)
    name.assign(cfg.visitFunctionExpression(this._hoistedFunctions[i]))
    cfg._connect(
      cfg.last(),
      new Operation(Operation.kind.STORE_VALUE, this._hoistedFunctions[i].id.name, null, null)
    )
    cfg._connect(cfg.last(), cfg._popValue())
  }
}

var FUNCTIONS = {
    'FunctionDeclaration': true
  , 'FunctionExpression': true
  , 'ArrowExpression': true
}

function _collectSharedInfo(sfi, node) {
  var inputNode = sfi._node

  estraverse.traverse(inputNode, {enter: enter})

  function enter(node, parent) {
    if (node.type === 'VariableDeclaration' && node.kind === 'var') {
      for(var i = 0, len = node.declarations.length; i < len; ++i) {
        sfi._hoistedVariables.push(node.declarations[i].id.name)
      }
    } else if (node.type === 'FunctionDeclaration' && node !== inputNode) {
      sfi._hoistedFunctions.push(node)
    }
    
    if (FUNCTIONS[node.type] && node !== inputNode) {
      this.skip()
    }
  }
}
