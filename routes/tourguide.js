const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Your Desk',
            path: false,
        },
        nav: {
            sidebarActive: 'desk',
        },
        layout: 'tourguide',
    }
    res.render('tourguide/dashboard/dashboard', metadata)
})

module.exports = router
