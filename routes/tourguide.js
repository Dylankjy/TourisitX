const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

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

router.get('/manage/listings', (req, res) => {
    const metadata = {
        meta: {
            title: 'Manage listings',
            path: false,
        },
        nav: {
            sidebarActive: 'listings',
        },
        layout: 'tourguide',
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
    res.render('tourguide/dashboard/listings', metadata)
})

router.get('/manage/listings/archived', (req, res) => {
    const metadata = {
        meta: {
            title: 'Manage listings',
            path: false,
        },
        nav: {
            sidebarActive: 'listings',
            sidebarSubActive: 'listingsArchived',
        },
        layout: 'tourguide',
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
    res.render('tourguide/dashboard/archived', metadata)
})

router.get('/bookings', (req, res) => {
    const metadata = {
        meta: {
            title: 'Bookings',
            path: false,
        },
        nav: {
            sidebarActive: 'bookings',
        },
        layout: 'tourguide',
    }
    res.render('tourguide/dashboard/bookings', metadata)
})

router.get('/bookings/:id', (req, res) => {
    const metadata = {
        meta: {
            title: 'Bookings',
            path: false,
        },
        nav: {
            sidebarActive: 'bookings',
        },
        layout: 'main',
    }
    res.render('tourguide/myJob', metadata)
})

router.get('/payments', (req, res) => {
    const metadata = {
        meta: {
            title: 'Payments',
            path: false,
        },
        nav: {
            sidebarActive: 'payments',
        },
        layout: 'tourguide',
        data: {
            transactions: { exampleTransaction, exampleTransaction2 },
        },
    }
    res.render('tourguide/dashboard/payments', metadata)
})

module.exports = router
