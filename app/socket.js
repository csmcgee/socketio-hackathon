module.exports = function(server) {
    var io = require('socket.io')(server);
    
    // almighty dependency
    var Promise = require('bluebird');
    
    // TODO: This should be an interface or adapter of some sort
    var r = require('rethinkdb');
    var redis = Promise.promisifyAll(require("redis"));
    var redis_client = redis.createClient({
        'host': 'redis'
    });

    var connection = null;
    var roomLib = require('./room/room.socket.js');
    var gameLib = require('./game/async.game.socket.js');


    redis_client.on("error", function (err) {
        console.log("Error " + err);
    });

    // clear redis on connection, on socket server setup
    redis_client.flushdbAsync().then(function(err, response) {
        if(err)
            console.log(err);
    });
    
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

    // establish web socket connection
    io.on('connection', function (socket) {
        var eventHandlers = {
            'room': new roomLib.RoomSocket(socket, io, server, redis, redis_client), // why is "new" required here
            'game': new gameLib.GameSocket(socket, io, server, redis, redis_client, connection, r, Promise),
        };

        for(var category in eventHandlers) {
            var handler = eventHandlers[category].handlers;
            for(var event in handler) {
                socket.on(event, handler[event]);
            }
        }
    });
}