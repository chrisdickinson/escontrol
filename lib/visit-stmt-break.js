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
  proto.visitBreak = visitBreak
}

function visitBreak(node) {
  var current = this._blockStack.current()
  var matches = node.label ? matchLabel : matchBreakable

  while (current) {
    if (matches(node, current)) {
      break
    }

    current = current.parent()
  }

  if (!this.current) {
    throw new Error('ran out of blocks!')
  }

  this._connect(this.last(), current.exit)
  this._unwindUntil(current)
}

function matchLabel(node, block) {
  return block.label === node.label.name
}

function matchBreakable(node, block) {
  return !!BREAKABLES[block.type]
}
