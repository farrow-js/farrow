const http = require('http')


const server = http.createServer((req, res) => {
  res.end('hello world')
})

server.listen(3000, () => {
  console.log('listen at 3000')
})