module.exports = makeUndefined

var Value = require('./value.js')
var typeOf = require('./types.js')

var Undefined = new Value(typeOf.UNDEFINED, void 0)

function makeUndefined() {
  return Undefined
}
