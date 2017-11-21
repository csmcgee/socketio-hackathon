var redis = require("redis"),
client = redis.createClient({
    'host': 'redis'
});

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function (err) {
    console.log("Error " + err);
});

module.exports.RoomSocket = function(socket, io, app) {

    this.handlers = {
        'join room': joinRoom.bind(this),
        'leave room': leaveRoom.bind(this),
        'disconnect': leaveRoom.bind(this),
    };

    function joinRoom(data) {
        // data check
        if(!data.roomId)
            return;

        io.sockets.in(data.roomId).clients(function(error, clients){

            // only two people allowed in a room
            if(clients.length == 2)
                return;

            client.get(socket.id, function(err, reply) {
                // if we get a reply then this socket is in a room
                if(reply)
                    return;

                socket.join(data.roomId, function(){
                    client.set(socket.id, data.roomId, redis.print);
                    client.rpush(["room"+data.roomId, socket.id], redis.print);
    
                    io.sockets.in(socket.id).emit('room joined', {
                        socketId: socket.id,
                        msg: 'Room successfully joined.',
                        roomId: data.roomId
                    });
    
                    client.llen("room"+data.roomId, function(err, reply) {
                        if(reply == 2)
                            io.sockets.in(data.roomId).emit('game ready', {ready: true});
                    });
    
                });
            });

        });
    }

    function leaveRoom() {
        client.get(socket.id, function(err, reply) {
            var roomId = reply;

            // was not in a room
            if(!roomId)
                return;

            socket.leave(roomId, function() {
                client.lrem("room"+roomId, 0, socket.id, redis.print)
                client.del(socket.id, redis.print);
                
                // alert player
                io.sockets.in(roomId).emit('message', {'msg': 'Player has left, spot open.'});
                io.sockets.in(socket.id).emit('room left', {'msg': 'Room left'});
            });
        });
            
    }
}