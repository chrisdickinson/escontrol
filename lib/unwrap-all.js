'use strict'

module.exports = unwrapAll

function unwrapAll(wrap) {
  var unwrapped = wrap

  if (!unwrapped) return unwrapped

  while (unwrapped && unwrapped.unwrap) {
    unwrapped = unwrapped._wrapped
  }

  return unwrapped
}

