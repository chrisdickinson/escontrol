var esprima = require('esprima')
  , pad = require('pad')
  , fs = require('fs')

var pretty = require('pretty-bytes')
var heapdump = require('heapdump')

var ast = esprima.parse(
    fs.readFileSync(process.argv[2], 'utf8')
  , {
        loc: true,
        tolerant: true
    }
)
var cfg = require('./index.js')(ast)

cfg.global().newprop('window').assign(cfg.global())

setImmediate(function iter() {
  var dt = Date.now()
  if (cfg.advance()) {
    if (Date.now() - dt > 4000) {
      console.log('dumping...')
      heapdump.writeSnapshot(function () {
        process.exit()
        setImmediate(iter)
      })
    } else {
      setImmediate(iter)
    
    }


    console.log('〉', pretty(process.memoryUsage().rss), cfg._stack[cfg._stack.length - 1].context.loc)
  } else {
    cfg._edges.map(function(xs) {
      // console.log(xs)
      // console.log(xs.kind, xs.from, xs.from ? xs.from.value || '' : '')
    })

    // console.log(cfg.global()._attributes)

    var attrs = cfg.global()._attributes
    Object.keys(attrs).forEach(function(xs) {
      console.log(xs, '=', attrs[xs]._value.classInfo())
    })
    
  }
})
