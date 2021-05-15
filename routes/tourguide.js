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

module.exports = router
