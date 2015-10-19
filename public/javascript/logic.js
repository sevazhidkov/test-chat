
var Chat = function(socket) {
    this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room: room,
        text: text
    };

    this.socket.emit('message', message);
};

Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join', {
        newRoom: room
    });
};

Chat.prototype.processCommand = function(command) {

    var words = command.split('[');
    var command = words[0].substring(1, words[0].length).toLowerCase();
    var value = words[1].substring(0, words[1].length - 1).toLowerCase();
    var message = false;

    switch (command) {
        case 'join':
            this.changeRoom(value);
            break;
        case 'nick':
            this.socket.emit('nameAttempt', value);
            break;
        default:
            message = 'Нераспознанная команда.';
            break;
    }
    return message;
};
