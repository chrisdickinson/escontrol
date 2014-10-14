function adder(base) {
  return function inner(value) {
    return base + value
  }
}


// create a function that returns a function
// that adds things together.
var myAdder = adder("string")
var val = myAdder(2)
