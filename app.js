const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");
const serverPort = 2004;

var proxyServer = httpProxy.createProxyServer();
var server = http.createServer(function(req, res){
  console.log(req.method + " " + req.url);
  proxyServer.web(req, res, {target: req.url});
}).listen(serverPort);

server.on("connect",function(req, socket, head){
  console.log(req.method + " " + req.url);
  var proxySocket = net.createConnection(req.url.split(":")[1], req.url.split(":")[0], function(){
    proxySocket.write(head);
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
  });
  proxySocket.pipe(socket);
  socket.pipe(proxySocket);
  proxySocket.on("error", function(){
    socket.write("HTTP/1.1 502 Connection Error\r\n\r\n");
    socket.end();
  });
  socket.on("error", function(){
      proxySocket.end();
  })
});
