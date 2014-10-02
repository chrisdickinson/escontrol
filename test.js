var esprima = require('esprima')
  , pad = require('pad')
  , fs = require('fs')

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

var now = Date.now(), dt
while(cfg.advance()) {
    dt = Date.now()
    if(false) console.log(
        dt - now,
        cfg._callStack.info(),
        pretty(process.memoryUsage().heapUsed),
        cfg._stack[cfg._stack.length - 1].fn.name,
        cfg._stack[cfg._stack.length - 1].context.loc &&
        cfg._stack[cfg._stack.length - 1].context.loc.start.line

    )
    now = dt
}

var attrs = cfg.global()._attributes
Object.keys(attrs).forEach(function(xs) {
  console.log(xs, '=', attrs[xs]._value.classInfo())
})

console.log(cfg._edges.length)


if(false)
setImmediate(function iter() {
  var dt = Date.now()
  if (cfg.advance()) {
    dt = Date.now() - dt
    if (false && Date.now() - dt > 4000) {
      console.log('dumping...')
      heapdump.writeSnapshot(function () {
        process.exit()
        setImmediate(iter)
      })
    } else {
      setImmediate(iter)
    
    }

    console.log(
        dt,
        cfg._callStack.info(),
        pretty(process.memoryUsage().heapUsed),
        cfg._stack[cfg._stack.length - 1].fn.name,
        cfg._stack[cfg._stack.length - 1].context.loc &&
        cfg._stack[cfg._stack.length - 1].context.loc.start.line

    )
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
