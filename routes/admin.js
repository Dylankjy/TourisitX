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

const exampleTransaction = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'Sex on the beach',
    cust_id: 'Takahashi Taro',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: true,
}

const exampleTransaction2 = {
    date_paid: new Date('2011-10-05T14:48:00.000Z'),
    tour_name: 'City Dwelling',
    cust_id: 'Ri Ui',
    tg_id: 'Nakamoto Yui',
    earnings: '1000',
    status: false,
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

router.get('/manage/tours', (req, res) => {
    const metadata = {
        meta: {
            title: 'Manage Tours',
            path: false,
        },
        nav: {
            sidebarActive: 'tourListings',
        },
        layout: 'admin',
        listing: [
            {
                name: 'Test listing',
                desc: 'This is a test listing',
                place: 'Gardens by the Bay',
            },
            {
                name: 'Test listing',
                desc: 'This is a test listing',
                place: 'Gardens by the Bay',
            },
            {
                name: 'Test listing',
                desc: 'This is a test listing',
                place: 'Gardens by the Bay',
            },
        ],
    }
    res.render('admin/listings', metadata)
})

module.exports = router
