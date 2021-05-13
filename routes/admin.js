const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Admin Dashboard',
            path: false,
        },
        nav: {
            sidebarActive: "dashboard",
        },
        layout: 'admin',
    }
    res.render('admin/dashboard', metadata)
})

router.get('/manage/users', (req, res) => {
    const metadata = {
        meta: {
            title: 'Manage Users',
            path: false,
        },
        nav: {
            sidebarActive: "users",
        },
        layout: 'admin',
    }
    res.render('admin/users', metadata) 
})

module.exports = router
