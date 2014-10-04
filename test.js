var esprima = require('esprima')
  , pad = require('pad')
  , fs = require('fs')

console.error('Usage: `node test.js <file> | dot -T svg > output.svg`')
console.error('   outputs global object info on stderr.')

var pretty = require('pretty-bytes')

var ast = esprima.parse(
    fs.readFileSync(process.argv[2], 'utf8')
  , {
        loc: true,
        tolerant: true
    }
)
var cfg = require('./index.js')(ast)

cfg.global().newprop('window').assign(cfg.global())

i = 0


while(cfg.advance()) {
}

var attrs = cfg.global()._attributes
Object.keys(attrs).forEach(function(xs) {
  console.error(xs, '=', attrs[xs]._value.classInfo())
})
var viz = require('./graphviz.js')
var out = viz(cfg)
console.log(out)
