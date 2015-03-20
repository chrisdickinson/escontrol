'use strict'

module.exports = install

var BREAKABLES = {
    'ForOfStatement': true
  , 'ForInStatement': true
  , 'ForStatement': true
  , 'WhileStatement': true
  , 'DoWhileStatement': true
  , 'SwitchStatement': true
}

function install(proto) {
  proto.visitBreakStatement = visitBreakStatement
}

function visitBreakStatement(node) {
  var current = this._currentBlock()
  var matches = node.label ? matchLabel : matchBreakable

  while (current) {
    if (matches(node, current)) {
      break
    }

    current = current.parent()
  }

  if (!current) {
    throw new Error('ran out of blocks!')
  }

  this._connect(this.last(), current.exit)
  this._setLastNode(this._createUnreachable())
}

function matchLabel(node, block) {
  return block.labels.indexOf(node.label.name) > -1
}

function matchBreakable(node, block) {
  return !!BREAKABLES[block.type]
}
