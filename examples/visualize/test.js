var escontrol = require('../../index.js')
var esprima = require('esprima')
var path = require('path')
var fs = require('fs')

var filename = path.resolve(process.argv[2])
var data = fs.readFileSync(filename, 'utf8')
var subject = esprima.parse(data)

var cfg = escontrol(subject)

while (cfg.advance()) {
  /* noop */
}

console.log(cfg.toDot())
