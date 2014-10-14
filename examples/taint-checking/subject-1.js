var http = require('http')

http.createServer(function handler(req, resp) {
  resp.writeHead(200, {
    'content-type': 'text/html'
  })

  var xs = req.url

  resp.write('<a href="' + xs + '">hello world</a>')
})

function sanitize(str) {
  // HAND WAVING INTENSIFIES
  return str
}


