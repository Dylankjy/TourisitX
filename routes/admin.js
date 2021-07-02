const express = require('express')

const { Shop, User } = require('../models')

const router = express.Router()

// Database operations
require('../app/db')

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
    return res.render('admin/dashboard', metadata)
})

router.get('/manage/users', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)

    User.findAll({ where: { 'is_admin': false }, limit: 15, offset: 0 + ((pageNo - 1) * 15) }).then( async (users) => {
        const userObjects = users.map((users) => users.dataValues)
        const totalNumberOfPages = Math.floor(await User.count({ where: { 'is_admin': false } }) / 15)

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
                users: userObjects,
                pagination: {
                    firstPage: 1,
                    lastPage: totalNumberOfPages + 1,
                    previous: pageNo - 1,
                    current: pageNo,
                    next: pageNo + 1,
                },
            },
        }

        return res.render('admin/users', metadata)
    }).catch((err) => {
        throw err
    })
})

router.get('/manage/staff', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }

    const pageNo = parseInt(req.query.page)

    User.findAll({ where: { 'is_admin': true }, limit: 15, offset: 0 + ((pageNo - 1) * 15) }).then(async (users) => {
        const userObjects = users.map((users) => users.dataValues)
        const totalNumberOfPages = Math.floor(await User.count({ where: { 'is_admin': true } }) / 15)

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
                users: userObjects,
                pagination: {
                    firstPage: 1,
                    lastPage: totalNumberOfPages + 1,
                    previous: pageNo - 1,
                    current: pageNo,
                    next: pageNo + 1,
                },
            },
        }
        return res.render('admin/staff', metadata)
    }).catch((err) => {
        throw err
    })
})

router.get('/manage/tours', (req, res) => {
    Shop.findAll(
        {
            where: {
                // Set to empty now, but it should be replaced with the userID when authentication library is out
                userId: 'sample',
            },
            order:
                [['createdAt', 'ASC']],
        },
    )
        .then(async (data)=>{
            const listings = []
            await data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })

            const metadata = {
                meta: {
                    title: 'Manage Tours',
                    path: false,
                },
                nav: {
                    sidebarActive: 'tourListings',
                },
                layout: 'admin',
                listing: listings,
            }
            return res.render('admin/listings', metadata)
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
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
        layout: 'admin',
        data: {
            transactions: { exampleTransaction, exampleTransaction2 },
        },
    }
    return res.render('admin/payments', metadata)
})


router.get('/tickets', (req, res) => {
    const metadata = {
        meta: {
            title: 'Support Tickets',
            path: false,
        },
        nav: {
            sidebarActive: 'tickets',
        },
        layout: 'admin',
    }
    return res.render('admin/tickets', metadata)
})

module.exports = router
