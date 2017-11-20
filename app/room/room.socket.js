// jsonDB is being reset on every socket call, or atleast reinitialized?
// if jsonDB is in global scope then we are okay
var jsonDB = {};

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
}