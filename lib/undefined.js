module.exports = makeUndefined

var Value = require('./value.js')
var typeOf = require('./types.js')

function makeUndefined() {
  return new Value(typeOf.UNDEFINED, void 0)
}
