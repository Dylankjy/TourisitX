// This file contains low level operations for the chat.
// -- Dylan


// Database operations
require('../db')
const { ChatRoom, ChatMessages } = require('../../models')
const { Op } = require('sequelize')

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

// Chloe!!! Please use this one for your booking chat. Don't use getAllMessagesByRoomID() <- this doesn't allow you to get booking chat
getAllBookingMessagesByRoomID = (roomId, callback) => {
    findDB('chatroom', { 'chatId': roomId }, (roomResult) => {
        if (roomResult.length !== 1) {
            return callback(null)
        }

        findDB('chatmessages', { 'roomId': roomId }, (msgResult) => {
            return callback({
                msg: msgResult.map((msgResult) => msgResult.dataValues),
                users: roomResult[0].dataValues.participants.split(','),
            })
        })
    })
}

getAllMessagesByRoomID = (roomId, callback) => {
    findDB('chatroom', { 'chatId': roomId, 'bookingId': null }, (roomResult) => {
        if (roomResult.length !== 1) {
            return callback(null)
        }

        findDB('chatmessages', { 'roomId': roomId }, (msgResult) => {
            return callback({
                msg: msgResult.map((msgResult) => msgResult.dataValues),
                users: roomResult[0].dataValues.participants.split(','),
            })
        })
    })
}


// getAllMessagesByRoomID('ec62a190-df1b-11eb-9fe2-db3cd0c5592f', (result) => {
//     console.log(result)
// })

getListOfRoomsByUserID = (uid, callback) => {
    if ( uuid.validate(uid) !== true) {
        return callback(false)
    }

    ChatRoom.findAll({
        where: {
            participants: {
                [Op.like]: '%' + uid + '%',
            },
        },
    }).then((result) => {
        const listOfChats = result.map((result) => result.dataValues)
        return callback(listOfChats)
    })
}

// getListOfRoomsByUserID('2f6f6ba0-d7d1-11eb-af9c-1749a0be6609', (result) => {
//     console.log(result)
// })


// module.exports = exports
module.exports = {
    addRoom,
    addMessage,
    getAllBookingMessagesByRoomID,
    getAllMessagesByRoomID,
    getListOfRoomsByUserID,
}
