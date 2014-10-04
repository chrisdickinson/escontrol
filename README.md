# escontrol

Generate ECMAScript 5 (and hopefully 6, soon) control flow graphs. Really
rough working state right now.

```
var escontrol = require('escontrol')
var esprima = require('esprima')

var ast = esprima.parse('<some code>')
var cfg = escontrol(ast)

while(cfg.advance()) ;

// get all edges!
var edges = cfg.edges()
```

## API

Hoo-boy. This is in a rough state at the moment.

## License

MIT
