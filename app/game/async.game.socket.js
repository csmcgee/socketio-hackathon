module.exports.GameSocket = function(socket, io, app, redis, client, connection, r) {

    this.handlers = {
        'gameturn': gameturn.bind(this),
    };


    // needs room, needs game object from both players and needs ids
    function rockPaperScissors(roomId){
        client.lrange("room"+roomId, 0, -1, function(err, response) {
            var socketIds = response;

            // game cannot be over, less than 2 people in room
            if(socketIds.length < 2)
                return false;

            // game cannot have more than 2 people in room with this game type
            if(socketIds.length > 2)
                throw new Error("Too many players");

            
            // get their data
            client.hgetall(socketIds[0], function (err, player1) {
                if(err)
                    throw new Error("Error when retrieving player 1 data.");
                client.hgetall(socketIds[1], function (err, player2) {
                    if(err)
                        throw new Error("Error when retrieving player 2 data.");

                    if(!player1.data || !player2.data)
                        return false;

                    // d = 0, tie
                    // d = 1, player at index 0 wins
                    // d = 2, player at index 1 wins
                    var d = (3 + player1.data - player2.data) % 3;
                    
                    var winners = null;
                    socketIds.forEach(function(player, index){
                        if(d == 0)
                            return io.sockets.in(player).emit('message', {'msg': 'DRAW'});
                
                        if((d == 1 && index == 0) || (d == 2 && index == 1)){
                            winner = player;
                            io.sockets.in(player).emit('message', {'msg': 'WIN'});
                        }else {
                            io.sockets.in(player).emit('message', {'msg': 'LOSE'});
                        }
                    });

                    var gameObj = {
                        players: socketIds
                    };

                    if(winner)
                        gameObj.winner = winner;
                
                    r.table('games').insert(gameObj).run(connection, function(err, res) {
                        if(err) throw err;
                            console.log(res);
                    });



                });
            });

        });
    
        return true;
    
    }

    function gameturn(data) {
        console.log(socket.id);
        console.log(data);


        client.hmset([socket.id, "data", data], function (err, res) {
            client.hgetall(socket.id, function (err, obj) {
                rockPaperScissors(obj.roomId);
            });
        });
    }

}