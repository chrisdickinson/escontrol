module.exports = install

function install(proto) {
  proto.visitLiteral = visitLiteral
}

function visitLiteral(node) {
  this._valueStack.push(node.value, true)
  this._pushValue(node.value)
}
