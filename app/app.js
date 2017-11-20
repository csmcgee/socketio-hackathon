var express = require('express');
var app = express();
var server = require('http').Server(app);
var socket = require('./socket.js');
socket(server);

app.use(express.static('public'))

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});