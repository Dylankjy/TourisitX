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
const { ChatRoom, ChatMessages, Session } = require('../../models')
const { Op } = require('sequelize')

// UUID
const uuid = require('uuid')

// Socketio client
const io = require('socket.io-client')

// System login invoker
const { invokeSystemLogin } = require('./invokeSystemLogin')

// Contain timeout function
let reconnectionErrorCounter = 0

let socket
startSocketClient = async () => {
    console.log(
        '\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[1m\x1b[35mPENDING\x1b[0m: Waiting for the Internal Socket Server...\x1b[0m',
    )

    socket = io('http://127.0.0.1:5000', {
        timeout: 10000,
        reconnectionAttempts: 5,
        reconnectionDelay: 10000,
        transportOptions: {
            polling: {
                extraHeaders: {
                    Cookie: `apikey=${await invokeSystemLogin()}`,
                },
            },
        },
    })

    socket.on('connect', (error) => {
        if (error) throw error
        // Message to show that the connection has been established.
        console.log(
            '\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[1m\x1b[34mOK\x1b[0m: Connection established successfully.\x1b[0m',
        )
    })

    socket.io.on('reconnect_attempt', (attempt) => {
        console.log(
            `\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[1m\x1b[35mPENDING\x1b[0m: Attempting reconnection... (${attempt}/5 tries)\x1b[0m`,
        )
    })

    // Handle connection failures
    socket.io.on('error', () => {
        console.log(
            `\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[0m\x1b[1m\x1b[31m\x1b[5mERROR\x1b[0m: Couldn't connect to Internal Socket Server. Is the server dead?`,
        )

        reconnectionErrorCounter++

        // If the reconnection counter is greater than 3, then the application will halt.
        if (reconnectionErrorCounter > 5) {
            console.log(
                `\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[0m\x1b[1m\x1b[31m\x1b[5mFAILED\x1b[0m\x1b[31m: 5 attempts were made to reconnect. All of which, have failed. Halting application.\x1b[0m`,
            )
            process.exit(2)
        }
    })
}

addRoom = (participants, bookingId, callback) => {
    if (typeof participants !== 'object') {
        throw new Error('Participants must of type object in a valid format.')
    }

    participantsStr = participants[0] + ',' + participants[1]

    const newRoomID = uuid.v1()

    const AddRoomPayload = {
        chatId: newRoomID,
        participants: participantsStr,
        bookingId: bookingId,
    }

    insertDB('chatroom', AddRoomPayload, (result) => {
    // In rare situations, should the db operation fail, do not panic.
    // It's okay if everything decides to burn up and perish.
        if (result !== true) {
            return callback(false)
        }

        // Returning callback will contain the UUID for that chat.
        return callback(newRoomID)
    })
}

addMessage = (roomId, senderId, messageText, flag, callback) => {
    // Ensures that this requested chatroom exists before performing any operations.
    findDB('chatroom', { chatId: roomId }, (roomResult) => {
        if (roomResult.length !== 1) {
            return callback(null)
        }

        if (senderId === 'SYSTEM') {
            senderId = uuid.NIL

            socket.emit('room', roomId)
            socket.emit('msgSend', {
                msg: messageText,
                roomId: roomId,
                senderId: senderId,
                pendingCount: -1,
                flag: flag,
            })
            console.log(
                '\x1b[1m\x1b[2m[SOCKET - Chat] - \x1b[1m\x1b[34mOK\x1b[0m: System is interacting with the internal socket server.\x1b[0m',
            )
        }

        const AddMessagePayload = {
            messageId: uuid.v1(),
            roomId: roomId,
            senderId: senderId,
            messageText: messageText,
            flag: flag,
        }

        insertDB('chatmessages', AddMessagePayload, () => {
            return callback(true)
        })
    })
}

// Chloe!!! Please use this one for your booking chat. Don't use getUwUMessagesByRoomID() <- this doesn't allow you to get booking chat
getAllTypesOfMessagesByRoomID = (roomId, callback) => {
    findDB('chatroom', { chatId: roomId }, (roomResult) => {
        if (roomResult.length !== 1) {
            return callback(null)
        }

        findDB('chatmessages', { roomId: roomId }, (msgResult) => {
            return callback({
                msg: msgResult.map((msgResult) => msgResult.dataValues),
                users: roomResult[0].dataValues.participants.split(','),
            })
        })
    })
}

getUwUMessagesByRoomID = (roomId, callback) => {
    findDB('chatroom', { chatId: roomId, bookingId: null }, (roomResult) => {
        if (roomResult.length !== 1) {
            return callback(null)
        }

        findDB('chatmessages', { roomId: roomId }, (msgResult) => {
            return callback({
                msg: msgResult.map((msgResult) => msgResult.dataValues),
                users: roomResult[0].dataValues.participants.split(','),
            })
        })
    })
}

// getUwUMessagesByRoomID('ec62a190-df1b-11eb-9fe2-db3cd0c5592f', (result) => {
//     console.log(result)
// })

excludeSelfIDAsync = (uid, listOfChats) => {
    return new Promise((res) => {
        reconstructedChatList = listOfChats
        syncLoop(
            listOfChats.length,
            (loop) => {
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
            },
            () => {
                return res(reconstructedChatList)
            },
        )
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
    getAllTypesOfMessagesByRoomID,
    getUwUMessagesByRoomID,
    excludeSelfIDAsync,
    getListOfRoomsByUserIDAsync,
    startSocketClient,
}
