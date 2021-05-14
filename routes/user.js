const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs')
})

router.get('/messages', (req, res) => {
    const metadata = {
        meta: {
            title: 'Your messages',
            path: false,
        },
        nav: {
            navbar: 'chat',
            sidebarActive: 'aa',
        },
        // layout: 'admin',
    }
    res.render('chat.hbs', metadata)
})


module.exports = router
