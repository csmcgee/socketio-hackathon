var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
app.use(express.static('public'))

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var jsonDB = {};

var example = {
  'players': [],
}

function rockPaperScissors(game){
  if(game.room.length < 2)
    return false;

  if(game.room.length > 2)
    throw new Error("Too many players");

  if(!game[game.room[0]] || !game[game.room[1]])
    return false;

  // d = 0, tie
  // d = 1, player at index 0 wins
  // d = 2, player at index 2 wins
  var d = (3 + game[game.room[0]] - game[game.room[1]]) % 3;

  game.room.forEach(function(player, index){
    if(d == 0)
      return io.sockets.in(player).emit('message', {'msg': 'DRAW'});

    if((d == 1 && index == 0) || (d == 2 && index == 1)){
      io.sockets.in(player).emit('message', {'msg': 'WIN'});
    }else {
      io.sockets.in(player).emit('message', {'msg': 'LOSE'});
    }
  });

  return true;

}

function leaveRoom(socketId) {
  var roomId = jsonDB[socketId];
  // was not in a room
  if(!roomId)
    return;

  // remove from room open a spot
  var index = jsonDB[roomId].room.indexOf(socketId);    
  jsonDB[roomId].room.splice(index, 1);
  delete jsonDB[roomId][socketId];

  jsonDB[socketId] = null;
  
  // alert player
  io.sockets.in(roomId).emit('message', {'msg': 'Player has left, spot open.'});
  io.sockets.in(socketId).emit('room left', {'msg': 'Room left'});
}

// establish web socket connection
io.on('connection', function (socket) {

  // join some room on create room event
  socket.on('join room', function (data) {
    // data check
    if(!data.roomId)
      return;

    jsonDB[data.roomId] = jsonDB[data.roomId] || {'room': []};

    io.sockets.in(data.roomId).clients(function(error, clients){

      // only two people allowed in a room
      if(clients.length == 2)
        return;

      // already in a room
      if(jsonDB[socket.id])
        return;


      socket.join(data.roomId, function(){
        jsonDB[data.roomId].room.push(socket.id);
        jsonDB[socket.id] = data.roomId;

        io.sockets.in(socket.id).emit('room joined', {
          socketId: socket.id,
          msg: 'Room successfully joined.',
          roomId: data.roomId
        });

        if(jsonDB[data.roomId].room.length == 2)
          io.sockets.in(data.roomId).emit('game ready', {ready: true});

      });


    });
  });

  socket.on('gameturn', function(data) {
    var roomId = jsonDB[socket.id];
    // if not in a room then this is not valid
    if(!roomId)
      return;

    jsonDB[roomId][socket.id] = data;

    if(rockPaperScissors(jsonDB[roomId])){
      io.sockets.to(roomId).emit('gamecomplete');
    }

  });

  socket.on('leave room', function(data) {
    leaveRoom(socket.id);
  });

  // on browser close, leave the room
  socket.on('disconnect', function(){
    leaveRoom(socket.id);
  });

});