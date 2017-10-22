var socket = io.connect('http://localhost:3000');
socket.on('message', function(data) {
    console.log('Incoming message:', data);
 });

 socket.on('game ready', function(data) {
    console.log('Game ready: Rock! Paper! Scissors! Shoot!');
 });

socket.on('room joined', function(data) {
    console.log(data);
});

$(document).ready(function(){

    $('#joinRoomBtn').click(function(){
        socket.emit('join room', {roomId: $('#roomIdInput').val()});
    });

    $('#readyBtn').click(function(){
        socket.emit('gameturn', $("input[type=radio][name=rps]:checked").val())
    });
});