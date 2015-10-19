
function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;

    if (message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }

    $('#send-message').val('');
}

function handleRoomChange(chatApp, socket) {

    var room = $('#roomname').val();

    if (room) {
        var roomChangeMessage = chatApp.processCommand('/join[' + room + ']');
        if (roomChangeMessage)
            $('#messages').append(divSystemContentElement(roomChangeMessage));
    }
}

function handleNameChange(chatApp, socket) {
    var nickname = $('#nickname').val();

    if (nickname) {
        var nicknameChangeMessage = chatApp.processCommand('/nick[' + nickname + ']');
        if (nicknameChangeMessage)
            $('#messages').append(divSystemContentElement(nicknameChangeMessage));
    }
}

var socket = io.connect();
$(document).ready(function() {

    var chatApp = new Chat(socket);

    socket.on('nameResult', function(result) {
        var message;
        if (result.success) {
            message = 'Теперь Ваше имя "' + result.name + '".';
        } else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    })

    socket.on('joinResult', function(result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Вы вошли в комнату.'));
    });

    socket.on('message', function(message) {
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms', function(rooms) {

        $('#room-list').empty();

        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-listdiv').click(function() {
            chatApp.processCommand('/join' + $(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();
    $('#send-form').submit(function() {
        processUserInput(chatApp, socket);
        return false;
    });
    $('#name_change').click(function() {
        handleNameChange(chatApp, socket);
        return false;
    });
    $('#room_change').click(function() {
        handleRoomChange(chatApp, socket);
        return false;
    });
});
