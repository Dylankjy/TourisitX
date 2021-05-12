const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Administration',
            path: false,
        },
        nav: {
            register: true,
        },
        layout: 'admin',
    }
    res.render('admin/dashboard', metadata)
})

module.exports = router
