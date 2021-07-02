const { urlencoded } = require('body-parser')
const express = require('express')
const formidable = require('express-formidable')
const bodyParser = require('body-parser')
const { route } = require('./admin')
const ExpressFormidable = require('express-formidable')
const fs = require('fs')
const fsPromise = require('fs/promises')
const exphbs = require('express-handlebars')
const expressSession = require('express-session')
const cors = require('cors')
const { default: axios } = require('axios')
const uuid = require('uuid')
const fileType = require('file-type')
const path = require('path')
const elasticSearch = require('elasticsearch')
const io = require('socket.io')
const { generateFakeEntry } =
  require('../app/listingGenerator').generateFakeEntry
const formidableValidator = require('../app/validation')
const { convert } = require('image-file-resize')

const genkan = require('../app/genkan/genkan')

// Globals
const router = express.Router()
const { Shop } = require('../models')
const elasticSearchHelper = require('../app/elasticSearch')

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator

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
    return res.render('tourguide/dashboard/dashboard', metadata)
})

router.get('/manage/listings', async (req, res) => {
    const sid = req.signedCookies.sid
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return res.send('Pls login')
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    Shop.findAll({
        where: {
            // Set to empty now, but it should be replaced with the userID when authentication library is out
            userId: userData.id,
            hidden: "false"
        },
        order: [['createdAt', 'ASC']],
    })
        .then((items) => {
            const itemsArr = items.map((x) => x['dataValues']).reverse()
            const metadata = {
                meta: {
                    title: 'Manage listings',
                    path: false,
                },
                nav: {
                    sidebarActive: 'listings',
                },
                layout: 'tourguide',
                listing: itemsArr,
            }
            return res.render('tourguide/dashboard/listings', metadata)
        })
        .catch((err) => {
            console.log
        })
})

router.get('/manage/listings/archived', async (req, res) => {
    const sid = req.signedCookies.sid
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return res.send('Pls login')
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    Shop.findAll({
        where: {
            // Set to empty now, but it should be replaced with the userID when authentication library is out
            userId: userData.id,
            hidden: "true"
        },
        order: [['createdAt', 'ASC']],
    })
        .then((items) => {
            const itemsArr = items.map((x) => x['dataValues']).reverse()
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
                listing: itemsArr,
            }
            return res.render('tourguide/dashboard/archived', metadata)
        })
        .catch((err) => {
            console.log
        })
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
    return res.render('tourguide/dashboard/bookings', metadata)
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
    return res.render('tourguide/myJob', metadata)
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
    return res.render('tourguide/dashboard/payments', metadata)
})

module.exports = router
