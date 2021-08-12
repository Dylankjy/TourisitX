
const express = require('express')

// Express.js
const router = express.Router()

// Formidable
const formidable = require('express-formidable')
const { addMessage, addRoom } = require('../app/chat/chat')
router.use(formidable())

// Database
const { ChatRoom } = require('../models')
const { Op } = require('sequelize')

// UUID
const uuid = require('uuid')

router.get('/', async (req, res) => {
    const metadata = {
        meta: {
            title: 'Your messages',
        },
        nav: {
            navbar: 'chat',
            chatSidebar: req.params.roomId,
        },
        layout: 'chat',
        data: {
            currentUser: req.currentUser,
            availableChats: await excludeSelfIDAsync(req.currentUser.id, await getListOfRoomsByUserIDAsync(req.currentUser.id)),
        },
    }

    return res.render('chat', metadata)
})

router.post('/start_chat', async (req, res) => {
    const { withParticipant, msgToSend, enquireTourID, enquireTourName } = req.fields

    // Find existing chat if one already exists
    const existingChatRoom = await ChatRoom.findAll({
        where: {
            participants: {
                [Op.like]: '%' + withParticipant + '%',
            },
            bookingId: null,
        },
    })

    if (existingChatRoom.length === 0) {
        return addRoom([req.currentUser.id, withParticipant], null, (resultantRoomID) => {
            return addMessage(resultantRoomID, uuid.NIL, `This enquiry is for <a class="has-text-weight-medium" href="/listing/info/${enquireTourID}">${enquireTourName}</a>.`, 'EMBED', () => {
                return addMessage(resultantRoomID, req.currentUser.id, msgToSend, 'SENT', () => {
                    return res.redirect(`/messages/${resultantRoomID}`)
                })
            })
        })
    }

    return addMessage(existingChatRoom[0].dataValues.chatId, uuid.NIL, `This enquiry is for <a class="has-text-weight-medium" href="/listing/info/${enquireTourID}">${enquireTourName}</a>.`, 'EMBED', () => {
        return addMessage(existingChatRoom[0].dataValues.chatId, req.currentUser.id, msgToSend, 'SENT', () => {
            return res.redirect(`/messages/${existingChatRoom[0].dataValues.chatId}`)
        })
    })
})

router.get('/:roomId', (req, res) => {
    getUwUMessagesByRoomID(req.params.roomId, async (chatRoomObject) => {
        // Checks whether chatroom exists and if the user requesting it has permissions to view it.
        if (chatRoomObject === null || chatRoomObject.users.includes(req.currentUser.id) === false) {
            const metadata = {
                meta: {
                    title: '404',
                },
                data: {
                    currentUser: req.currentUser,
                },
            }
            res.status = 404
            return res.render('404', metadata)
        }

        const metadata = {
            meta: {
                title: 'Your messages',
            },
            nav: {
                navbar: 'chat',
                chatSidebar: req.params.roomId,
            },
            layout: 'chat',
            data: {
                currentUser: req.currentUser,
                chat: chatRoomObject.msg,
                availableChats: await excludeSelfIDAsync(req.currentUser.id, await getListOfRoomsByUserIDAsync(req.currentUser.id)),
            },
        }

        return res.render('chat', metadata)
    })
})

module.exports = router
