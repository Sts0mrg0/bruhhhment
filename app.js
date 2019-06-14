const http = require("http");
const net = require("net");
const httpProxy = require("http-proxy");
const serverPort = 2004;
const timeoutTime = 300000;

var proxyServer = httpProxy.createProxyServer();
var server = http.createServer(function(req, res){
  console.log(req.method + " " + req.url);
  proxyServer.web(req, res, {target: req.url});
}).listen(serverPort);
server.on("error", function(err){});
proxyServer.on("error", function(err){});

server.on("connect",function(req, socket, head){
  var proxySocket = net.createConnection(req.url.split(":")[1], req.url.split(":")[0], function(){
    console.log(req.method + " " + req.url + " [Info] " + "Connection Established");
    proxySocket.write(head);
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    proxySocket.on("data", function(chunk){
      socket.write(chunk);
    });
    socket.on("data", function(chunk){
      proxySocket.write(chunk);
    });

    proxySocket.on("end", function(){
      socket.end();
    });
    socket.on("end", function(){
      console.log(req.method + " " + req.url + " [Info] " + "Connection Ended");
      proxySocket.end();
    });

    proxySocket.setTimeout(timeoutTime, function(){
      console.log(req.method + " " + req.url + " [Error] " + "Connection Timed Out");
      socket.end();
      proxySocket.end();
    });

    proxySocket.on("error", function(err){
      console.log(req.method + " " + req.url + " [Error] " + err.message);
      socket.write("HTTP/1.1 502 Connection Failed\r\n\r\n");
      socket.end();
    });
    socket.on("error", function(err){
      console.log(req.method + " " + req.url + " [Error] " + err.message);
      proxySocket.end();
    });
  });
});
