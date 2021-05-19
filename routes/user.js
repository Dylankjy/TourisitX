const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs')
})

router.get('/setting/general', (req, res) => {
    const metadata = {
        meta: {
            title: 'General Setting',
            path: false,
        },
        nav: {
            sidebarActive: '',
        },
        layout: 'setting',
    }
    res.render('users/general.hbs', metadata)
})

router.get('/setting/password', (req, res) => {
    const metadata = {
        meta: {
            title: 'Password',
            path: false,
        },
        nav: {
            sidebarActive: '',
        },
        layout: 'setting',
    }
    res.render('users/password.hbs', metadata)
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
        layout: 'chat',
    }
    res.render('chat.hbs', metadata)
})


module.exports = router
