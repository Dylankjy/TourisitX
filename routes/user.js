const { static } = require('express')
const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile', (req, res) => {
    const metadata = {
        meta: {
            title: 'profile',
            path: false,
        },
        nav: {
            sidebarActive: '',
        },
        layout: '',
    }
    res.render('users/profile.hbs', {
        user: {
            name: 'Harold Chan',
            password: 'password',
            email: 'test@email.com',
            bio: 'Hide The Pain',
            pfp: '/static/pfp.jpg',
            phone_number: '12348765',
            account_mode: 0,
            fb: 'https://www.facebook.com/',
            insta: 'https://www.instagram.com/',
            li: 'https://www.linkedin.com/company/paul-immigrations/'
        }
    })
});

router.get('/setting/general', (req, res) => {
    const metadata = {
        meta: {
            title: 'General Setting',
            path: false,
        },
        nav: {
            sidebarActive: 'general',
        },
        layout: 'setting',
        user: {
            name: 'Harold Chan',
            password: 'password',
            email: 'test@email.com',
            bio: 'Hide The Pain',
            pfp: '/static/pfp.jpg',
            phone_number: '12348765',
            account_mode: 0,
            fb: 'https://www.facebook.com/',
            insta: 'https://www.instagram.com/',
            li: 'https://www.linkedin.com/company/paul-immigrations/'

        }
    }
    res.render('users/general.hbs', metadata)
});

router.get('/setting/password', (req, res) => {
    const metadata = {
        meta: {
            title: 'Password',
            path: false,
        },
        nav: {
            sidebarActive: 'password',
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
