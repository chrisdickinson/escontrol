var escontrol = require('../../index.js')
var esprima = require('esprima')
var path = require('path')
var pad = require('pad')
var fs = require('fs')

var text = fs.readFileSync(process.argv[2], 'utf8')
var ast = esprima.parse(text)

var cfg = escontrol(ast, {})

while(cfg.advance()) {
}

var attrs = cfg.global()._attributes
Object.keys(attrs).forEach(function(xs) {
  console.error(xs, '=', attrs[xs].value().classInfo())
})
