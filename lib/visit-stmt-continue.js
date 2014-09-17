'use strict'

module.exports = install

var LOOPS = {
    'ForOfStatement': true
  , 'ForInStatement': true
  , 'ForStatement': true
  , 'WhileStatement': true
  , 'DoWhileStatement': true
}

function install(proto) {
  proto.visitContinueStatement = visitContinueStatement
}

function visitContinueStatement(node) {
  var current = this._blockStack.current()
  var matches = node.label ? matchLabel : matchContinuable

  while (current) {
    if (matches(node, current)) {
      break
    }

    current = current.parent()
  }

  if (!current) {
    throw new Error('ran out of blocks!')
  }

  this._connect(this.last(), current.enter)
  this._setLastNode(this._createUnreachable())
}

function matchLabel(node, block) {
  return block.labels.indexOf(node.label.name) > -1
}

function matchContinuable(node, block) {
  return block.type in LOOPS
}
