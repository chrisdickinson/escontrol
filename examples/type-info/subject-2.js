function adder(base) {
  return function inner(value) {
    return base + value
  }
}


// create a function that returns a function
// that adds things together.
var myAdder = adder(3)
var val = myAdder(2)
var other = myAdder('ok')
