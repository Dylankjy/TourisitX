
const express = require('express')

// Express.js
const app = express()
const router = express.Router()

// Socket.io injection read from app.js
const io = app.get('io')

// place this middleware before any other route definitions
// makes io available as req.io in all request handlers
app.use((req, res, next) => {
    req.io = io
    next()
})


router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Your messages',
            path: false,
        },
        nav: {
            navbar: 'chat',
            sidebarActive: 'aa',
        },
        layout: 'chat',
        data: {
            currentUser: req.currentUser,
        },
    }
    return res.render('chat.hbs', metadata)
})

module.exports = router
