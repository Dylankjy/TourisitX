
const express = require('express')

// Express.js
const app = express()
const router = express.Router()

// Formidable
const formidable = require('express-formidable')
router.use(formidable())

// SQLize models
const { ChatRoom, ChatMessages } = require('../models')


router.get('/:roomId', (req, res) => {
    getAllMessagesByRoomID(req.params.roomId, async (chatRoomObject) => {
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

router.post('/', (req, res) => {
    console.table(req.fields)
    // addMessage(req.fields.chatId)
})

module.exports = router
