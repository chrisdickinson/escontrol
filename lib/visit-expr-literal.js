module.exports = install

function install(proto) {
  proto.visitLiteral = visitLiteral
}

function visitLiteral(node) {
  this._pushValue(node.value, true)
}
