module.exports = visualize

function visualize(edges, onerror) {
  var output = []
  var nodes = []

  var node
  var id = 1

  var seen = new Set()

  onerror = onerror || Function()
  output.push('digraph Program {')
  output.push('node [margin=0 textalign=left]')

  var mapped = new Map()
  var ID = 0

  for (var i = 0, len = edges.length; i < len; ++i) {

    node = edges[i].from

    if (node) {
      if (node._operations && node._operations[0]._isUnreachable) {
        continue
      }

      if(!seen.has(node)) {
        mapped.set(node, ++ID)
        output.push(`${ID} [label=${JSON.stringify(node.human())}]`)
        seen.add(node)
      }
    }

    node = edges[i].to

    if (node) {
      if(!seen.has(node)) {
        mapped.set(node, ++ID)
        output.push(`${ID} [label=${JSON.stringify(node.human())}]`)
        seen.add(node)
      }
    }

    var color = {
      'if-true': 'green',
      'if-false': 'red',
      'exception': 'purple',
      'back-edge': 'orange',
      'normal': 'gray'
    }[edges[i].kind]

    color = edges[i].unreachable ? 'blue' : color

    if (edges[i].from && edges[i].to) {
      output.push(
        mapped.get(edges[i].from) +
        ' -> ' +
        mapped.get(edges[i].to) +
        '[color="' + color + '"]'
      )
    }
  }
  output.push('}')

  return output.join('\n')
}
