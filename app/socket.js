module.exports = function(server) {
    var io = require('socket.io')(server);
    var r = require('rethinkdb');
    var connection = null;
    var roomLib = require('./room/room.socket.js');
    
    /**
     * Get all games user was in
     * 
     * r.table("games").filter(function(game) {
     *  return game("players").contains("RM53_UA1wJU1duIrAAAC")
     * });
     * 
     */
    
    /**
     * Get winning games
     * 
     * r.table('games').filter({winner: 'RM53_UA1wJU1duIrAAAC'})
     *
    */
    /**
     * Get games that were a draw
     * 
     * r.table("games").filter(function(game) {
     *  return game("players").contains("RM53_UA1wJU1duIrAAAC")
     * }).filter(function (game) {
     *  return game.hasFields('winner').not();
     * })
     * 
     */
    
    
    // TODO: change to use config file or something
    r.connect({ host: 'db', port: 28015 }, function(err, conn) {
        if(err) throw err;
        connection = conn;
        r.db('test').tableCreate('games').run(connection, function(err, res) {
            if(err)
            return;
        });
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
        // d = 2, player at index 1 wins
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
    
        var gameObj = {
            players: game.room
        };
    
        if(d != 0)
            gameObj.winner = game.room[d - 1];
    
        r.table('games').insert(gameObj).run(connection, function(err, res) {
            if(err) throw err;
            console.log(res);
        });
    
        return true;
    
    }
      
    // establish web socket connection
    io.on('connection', function (socket) {
        var eventHandlers = {
            'room': new roomLib.RoomSocket(socket, io, server) // why is "new" required here
        };

        for(var category in eventHandlers) {
            var handler = eventHandlers[category].handlers;
            for(var event in handler) {
                socket.on(event, handler[event]);
            }
        }

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
    
    });
}