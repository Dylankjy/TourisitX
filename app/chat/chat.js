// This file contains low level operations for the chat.
// -- Dylan

// Genkan API
const genkan = require('../genkan/genkan')

// Sync loops
// I know that this is extremely stupid and not good but screw you. I just need this to work
// I've spent 3 flipping hours trying to make this work. After this, I will go to a corner and cry.
// Leaf me alone :(
const syncLoop = require('sync-loop')

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
    // Ensures that this requested chatroom exists before performing any operations.
    findDB('chatroom', { 'chatId': roomId }, (roomResult) => {
        if (roomResult.length !== 1) {
            return callback(null)
        }

        if (senderId === 'SYSTEM') {
            senderId = '00000000-0000-0000-0000-000000000000'
        }

        const AddMessagePayload = {
            'messageId': uuid.v1(),
            'roomId': roomId,
            'senderId': senderId,
            'messageText': messageText,
            'flag': flag,
        }

        insertDB('chatmessages', AddMessagePayload, () => {
            return callback(true)
        })
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

excludeSelfIDAsync = async (uid, listOfChats) => {
    return new Promise((res) => {
        reconstructedChatList = listOfChats
        syncLoop(listOfChats.length, (loop) => {
            const i = loop.iteration()

            const arrayOfParticipants = listOfChats[i].participants.split(',')

            const indexToDeleteSelf = arrayOfParticipants.indexOf(uid)

            arrayOfParticipants.splice(indexToDeleteSelf, 1)

            const receiverUid = arrayOfParticipants[0]

            genkan.getUserByID(receiverUid, (userObject) => {
                if (userObject === null) {
                    return res(null)
                }
                reconstructedChatList[i].receiverUid = userObject.id
                reconstructedChatList[i].receiverName = userObject.name
                loop.next()
            })
        }, () => {
            return res(reconstructedChatList)
        })
    })
}

getListOfRoomsByUserIDAsync = (uid) => {
    return new Promise((res, rej) => {
        if (uuid.validate(uid) !== true) {
            return rej(new Error('Invalid User ID'))
        }

        ChatRoom.findAll({
            where: {
                participants: {
                    [Op.like]: '%' + uid + '%',
                },
                bookingId: null,
            },
        }).then((result) => {
            const listOfChats = result.map((result) => result.dataValues)
            return res(listOfChats)
        })
    })
}

// module.exports = exports
module.exports = {
    addRoom,
    addMessage,
    getAllBookingMessagesByRoomID,
    getAllMessagesByRoomID,
    excludeSelfIDAsync,
    getListOfRoomsByUserIDAsync,
}
