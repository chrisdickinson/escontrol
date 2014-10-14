var escontrol = require('../../index.js')
var esprima = require('esprima')
var assert = require('assert')
var fs = require('fs')

var text = fs.readFileSync(process.argv[2], 'utf8')
var subject = esprima.parse(text)

var cfg = escontrol(subject, {
  onfunction: onfunction,
  oncalled: oncalled,
  onoperation: onoperation
})

var sanitizeValue = null
var handlerValue = null
while(cfg.advance()) {
  /* noop */;
}

var req = cfg.makeObject()
var res = cfg.makeObject()
var url = cfg.makeValue('string')
var write = cfg.makeFunction(function(cfg, thisValue, args, isNew) {
  assert.ok(!args[0].getMark('tainted').some(Boolean), 'value was tainted')
  cfg._valueStack.push(cfg.makeValue('string'))
})

req.newprop('url').assign(url)
res.newprop('write').assign(write)
url.setMark('tainted', true)

handlerValue.call(cfg, cfg.global(), [req, res], false)
while(cfg.advance()) {
  /* noop */;
}

function onfunction(value, node) {
  var name = node.id ? node.id.name : ''
  switch(name) {
    case 'handler': handlerValue = value; break
    case 'sanitize': sanitizeValue = value; break
  }
}

function oncalled(fn, context, args, recurses, result) {
  if (fn === sanitizeValue) {
    this._valueStack.pop()
    this._valueStack.push(cfg.makeValue(result._type, result._value))
  }
}

function onoperation(args, op, result) {
  // if any operand is tainted, mark the result
  // tainted
  var shouldTaint = args.some(function(xs) {
    return xs.getMark('tainted').some(Boolean)
  })

  if (shouldTaint) result.setMark('tainted', true)
}
