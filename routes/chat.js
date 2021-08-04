
const express = require('express')

// Express.js
const router = express.Router()

// Formidable
const formidable = require('express-formidable')
router.use(formidable())

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
