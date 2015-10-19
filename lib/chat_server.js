var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('loglevel', 1);
    io.sockets.on('connection', function(socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Гостинная');
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Гость' + guestNumber;
    nickNames[socket.id] = name;

    socket.emit('nameResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);

    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;

    socket.emit('joinResult', {
        room: room
    });
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' вошел в ' + room + '.'
    });

    var usersInRoom = io.sockets.clients(room);

    if (usersInRoom.length > 1) {
        var usersInRoomSummary = 'В комнате "' + room + '" сейчас: ';
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {
            text: usersInRoomSummary
        });
    }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name) {

        if (name.indexOf('Гость') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Имена не должны начинаться с "Гость".'
            });
        } else {
            if (namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];

                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' сменил имя на ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'Это имя уже используется'
                });
            }
        }
    });
}

function handleMessageBroadcasting(socket, nickNames) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            text: nickNames[socket.id] + ' вышел из чата'
        });
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}