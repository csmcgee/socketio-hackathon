var express = require('express');
var app = express();
var server = require('http').Server(app);
var socket = require('./socket.js');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

// TODO: This should be an interface or adapter of some sort
var r = require('rethinkdb');

// TODO: change to use config file or something
r.connect({ host: 'db', port: 28015 }, function(err, conn) {
    if(err) throw err;
    connection = conn;
    r.db('test').tableCreate('games').run(connection, function(err, res) {
        if(err)
            return;
    });

    r.db('test').tableCreate('users').run(connection, function(err, res) {
        if(err)
            return;
    });
});

socket(server, r);

app.set('view engine', 'ejs');
app.use(express.static('public'))

server.listen(3000);

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/signup', function (req, res) {
  res.render('signup')
});