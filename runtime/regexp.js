module.exports = makeRegExp

var hidden = require('../lib/values/hidden-class.js')

function makeRegExp (cfg, globals, quickFn) {
  var regexpProto = cfg._builtins.getprop('[[RegExpProto]]').value()
  var regexpCons = quickFn('RegExp', RegExpImpl, globals, hidden.initial.REGEXP)

  regexpCons.getprop('prototype').assign(regexpProto)
}

function RegExpImpl (cfg, thisValue, args, isNew) {
  var out = this.makeNew()
  cfg._valueStack.push(out)
}
