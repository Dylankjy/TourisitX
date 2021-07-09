// This file contains low level operations for the chat.
// -- Dylan


// Database operations
require('../db')

// UUID
const uuid = require('uuid')

addRoom = (participants, bookingId, callback) => {
    if (typeof (participants) !== 'object') {
        throw new Error('Participants must of type object in a valid format.')
    }

    participantsStr = participants[0] + ',' + participants[1]

    const AddRoomPayload = {
        'chatId': uuid.v1(),
        'participants': participantsStr,
        'bookingId': bookingId,
    }

    insertDB('chatroom', AddRoomPayload, (result) => {
        // In rare situations, should the db operation fail, do not panic.
        // It's okay if everything decides to burn up and perish.
        if (result !== true) {
            return callback(false)
        }

        // Returning callback will contain the UUID for that chat.
        return callback(AddRoomPayload.chatId)
    })
}

addMessage = (roomId, senderId, messageText, flag, callback) => {
    if (senderId === 'SYSTEM') {
        senderId = '00000000-0000-0000-0000-000000000000'
    }

    const AddMessagePayload = {
        'messageId': uuid.v4(),
        'roomId': roomId,
        'senderId': senderId,
        'messageText': messageText,
        'flag': flag,
    }

    insertDB('chatmessages', AddMessagePayload, () => {
        return callback(true)
    })
}

// const exports = {
//     'room': {
//         add: addRoom,
//     },
//     'msg': {
//         add: addMessage,
//     },
// }
getAllMessagesByRoomID = (roomId, callback) => {
    findDB('chatroom', { 'chatId': roomId }, (roomResult) => {
        if (roomResult.length !== 1) {
            return null
        }

        findDB('chatmessages', { 'roomId': roomId }, (msgResult) => {
            return callback({
                msg: msgResult.map((msgResult) => msgResult.dataValues),
                users: roomResult[0].dataValues.participants.split(','),
            })
        })
    })
}

getAllMessagesByRoomID('ec62a190-df1b-11eb-9fe2-db3cd0c5592f', (result) => {
    console.log(result)
})

// module.exports = exports
module.exports = {
    addRoom,
    addMessage,
}
