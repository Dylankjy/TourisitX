const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

const exampleUser = {
    name: 'Takahashi Taro',
    email_status: true,
    registration_time: new Date('2011-10-05T14:48:00.000Z'),
    last_seen_time: new Date('2011-10-05T14:48:00.000Z'),
    account_mode: 1,
    ip_address: '10.0.0.10',
}

const exampleUser2 = {
    name: 'Niho Yoshiko',
    email_status: true,
    registration_time: new Date('2011-10-05T14:48:00.000Z'),
    last_seen_time: new Date('2011-10-05T14:48:00.000Z'),
    account_mode: 0,
    ip_address: '10.0.0.10',
}

router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Admin Dashboard',
            path: false,
        },
        nav: {
            sidebarActive: 'dashboard',
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
            sidebarActive: 'users',
        },
        layout: 'admin',
        data: {
            users: { exampleUser, exampleUser2 },
        },
    }
    res.render('admin/users', metadata)
})

router.get('/manage/staff', (req, res) => {
    const metadata = {
        meta: {
            title: 'Manage Staff',
            path: false,
        },
        nav: {
            sidebarActive: 'staff',
        },
        layout: 'admin',
        data: {
            users: { exampleUser, exampleUser2 },
        },
    }
    res.render('admin/staff', metadata)
})

module.exports = router
