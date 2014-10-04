module.exports = visualize

function visualize(cfg) {
  var output = []
  var nodes = []

  var edges = cfg._edges
  var node
  var id = 1

  var seen = {}

  output.push('digraph Program {')
  output.push('node [margin=0 shape=box textalign=left]')
  for (var i = 0, len = edges.length; i < len; ++i) {

    node = edges[i].from

    if (!node) {
      console.error('from', edges[i])
      continue
    }

    if(!seen[node.human()]) {
      node.gvzName = JSON.stringify(node.human())
      output.push(node.gvzName + ';')
      seen[node.human()] = true
    }

    node = edges[i].to

    if (!node) {
      console.error('to', edges[i])
      continue
    }

    if(!seen[node.human()]) {
      node.gvzName = JSON.stringify(node.human())
      output.push(node.gvzName + ';')
      seen[node.human()] = true
    }

    var color = {
      'if-true': 'green',
      'if-false': 'red',
      'exception': 'purple',
      'back-edge': 'orange',
      'normal': 'gray'
    }[edges[i].kind]

    color = edges[i].unreachable ? 'blue' : color

    output.push(edges[i].from.gvzName + ' -> ' + edges[i].to.gvzName + '[color="' + color + '"]')
  }
  output.push('}')

  return output
}
