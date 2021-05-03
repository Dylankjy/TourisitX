const express = require('express')

const router = express.Router()

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


module.exports = router
