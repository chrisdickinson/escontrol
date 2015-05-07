module.exports = SharedFunctionInfo

var Operation = require('../../operation.js')
var hidden = require('./hidden-class.js')
var estraverse = require('estraverse')

function SharedFunctionInfo(node) {
  this._node = node
  this._hoistedVariables = []
  this._hoistedFunctions = []
  this._records = []

  this._instantiatedTimes = 0

  _collectSharedInfo(this, node)
}

var proto = SharedFunctionInfo.prototype

proto.arity = function SharedFunctionInfo_arity() {
  return this._node.params.length
}

proto.callCount = function SharedFunctionInfo_callCount() {
  return this._records.length
}

proto.recordCall = function SharedFunctionInfo_recordCall(thisValue, argObject, argArray, isNew) {
  var argHCIDs = thisValue.getHCID()

  for (var i = 0, len = argArray.length; i < len; ++i) {
    argHCIDs = argHCIDs.concat(argArray[i].getHCID())
  }

  var record = new CallRecord(argHCIDs)
  this._records.push(record)
  return record
}

proto.signature = function() {
  var paramLength = this._node && this._node.params ? this._node.params.length + 1 : 1
  var slots = []
  var ret = {__proto__: null}

  for(var i = 0; i < paramLength; ++i) {
    slots.push({__proto__: null})
  }

  for(var i = 0, len = this._records.length; i < len; ++i) {
    var record = this._records[i]

    for(var j = 0; j < paramLength; ++j) {
      slots[j][record._hcids[j]] = true
    }

    if (record._return)
    for(var j = 0; j < record._return.length; ++j) {
      ret[record._return[j]] = true
    }
  }

  var params = this._node.params

  slots = slots.map(function(xs, idx) {
    return (idx === 0 ? 'this' : params[idx - 1].name) + ':' + Object.keys(xs).map(function(hcid) {
      return hcid === undefined || hidden.get(hcid) === undefined ? '???' : hidden.get(hcid).toName()
    }).join(';')
  }).join(', ')

  ret = Object.keys(ret).map(function(xs) {
    return hidden.get(xs).toName()
  }).join(', ')

  return slots + ' -> ' + ret
}

proto.recordReturn = function SharedFunctionInfo_recordReturn(record, results, exceptions) {
  record.recordReturn(results, exceptions)
}

proto.contributeToContext = function SharedFunctionInfo_contributeToContext(cfg) {
  for (var i = 0, len = this._hoistedVariables.length; i < len; ++i) {
    cfg._scopeStack.newprop(this._hoistedVariables[i], 'var').assign(cfg.makeUndefined())
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

function CallRecord(hcids) {
  this._hcids = hcids || []
  this._return = null
  this._thrown = null
}

CallRecord.prototype.recordReturn = function(returned, thrown) {
  this._return = returned.getHCID()
  // this._thrown = thrown.getHCID()
}
