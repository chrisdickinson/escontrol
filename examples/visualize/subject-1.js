var console = {
  log: function() {}
}

function compare(lhs, rhs) {
  return lhs - rhs > 0
}

if (compare(Math.random(), 0.5)) {
  console.log('hello!')
} else {
  console.log('hi.')
}
