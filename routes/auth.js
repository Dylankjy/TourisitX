const express = require('express')

const router = express.Router()

// Dependencies for authentication system
require('../app/genkan/login')
require('../app/genkan/logout')
require('../app/genkan/register')
require('../app/genkan/resetPassword')

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/login', (req, res) => {
    const metadata = {
        meta: {
            title: 'Login',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
    }
    res.render('auth/login', metadata)
})

router.get('/register', (req, res) => {
    const metadata = {
        meta: {
            title: 'Register',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
    }
    res.render('auth/register', metadata)
})

router.get('/recover', (req, res) => {
    const metadata = {
        meta: {
            title: 'Recover Tourisit ID',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'auth',
    }
    res.render('auth/recover', metadata)
})


module.exports = router
