const http = require("http");
const net = require("net");
const url = require("url");
const httpProxy = require("http-proxy");
const serverPort = 2003;

function decodeRequest(req)
{
    req.url = decodeURIComponent(req.url).slice(1,req.url.length);
    req.headers["host"] = new url(req.url).host;
    return req;
}

function rawifyRequest(req)
{
  var msg = req.method + " " + req.url + " HTTP/" + req.httpVersion + "\r\n";
  for(var k in req.headers)
    msg += k + ": " + req.headers[k] + "\r\n";
  msg += "\r\n";
  return msg;
}

var proxyServer = httpProxy.createProxyServer();
var server = http.createServer(function(req, res){
  console.log(rawifyRequest(req));
  proxyServer.web(req, res, {target: {host: req.headers.host, port: req.port}});
}).listen(serverPort);

server.on("connect",function(req, socket, head){
  console.log(rawifyRequest(req));
  var proxySocket = net.createConnection(req.headers.host.split(":")[1], req.headers.host.split(":")[0], function(){
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
