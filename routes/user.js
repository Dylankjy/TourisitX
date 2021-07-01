const express = require('express')
const fs = require('fs')
const { default: axios } = require('axios')
const uuid = require('uuid')
const path = require('path')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const genkan = require('../app/genkan/genkan')
// const cookieParser = require('cookie-parser')
const { convert } = require('image-file-resize')

const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray } = require('../app/helpers')

// Config file
const config = require('../config/apikeys.json')

// Globals
const router = express.Router()
const { User } = require('../models')

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator

const savedImageFolder = './storage/'

require('../app/db')

router.use(formidable())
// router.use(cookieParser('Please change this when in production use'))

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile', (req, res) => {
    const metadata = {
        meta: {
            title: 'profile',
            path: false,
        },
        nav: {
            sidebarActive: '',
        },
        layout: '',
    }
    return res.render('users/profile.hbs', {
        user: {
            name: 'Harold Chan',
            password: 'password',
            email: 'test@email.com',
            bio: 'Hide The Pain',
            pfp: '/static/pfp.jpg',
            phone_number: '12348765',
            account_mode: 0,
            fb: 'https://www.facebook.com/',
            insta: 'https://www.instagram.com/',
            li: 'https://www.linkedin.com/company/paul-immigrations/',
        },
    })
})

router.get('/setting/general', async (req, res) => {
    var sid = req.signedCookies.sid
    if (sid == undefined) {
        return requireLogin(res);
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        return requireLogin(res);
    }

    var user = await genkan.getUserBySessionAsync(sid)
    const metadata = {
        meta: {
            title: 'General Setting',
            path: false,
        },
        nav: {
            sidebarActive: 'general',
        },
        layout: 'setting',
        user,
    }
    return res.render('users/general.hbs', metadata)
})

router.post('/setting/general', async (req, res) => {
    const v = new Validator(req.fields)
    var sid = req.signedCookies.sid
    if (sid == undefined) {
        return requireLogin(res);
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
        return requireLogin(res);
    }

    var user = await genkan.getUserBySessionAsync(sid)
    
    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    const nameResult = v
        .Initialize({
            name: 'tourTitle',
            errorMessage: 'Tour Title must be min 5 characters long',
        })
        .exists()
        .isLength({ min: 5 })
        .getResult()

    const descResult = v
        .Initialize({
            name: 'tourDesc',
            errorMessage: 'Please enter a Tour description',
        })
        .exists()
        .getResult()

    const durationResult = v
        .Initialize({
            name: 'tourDuration',
            errorMessage: 'Please enter a Tour Duration',
        })
        .exists()
        .getResult()

    const timingResult = v
        .Initialize({
            name: 'finalTimings',
            errorMessage: 'Please provide a Tour Timing',
        })
        .exists()
        .getResult()

    const dayResult = v
        .Initialize({
            name: 'finalDays',
            errorMessage: 'Please provide a Tour Day',
        })
        .exists()
        .getResult()

    const itineraryResult = v
        .Initialize({
            name: 'finalItinerary',
            errorMessage: 'Please create a Tour Itinerary',
        })
        .exists()
        .getResult()

    const locationResult = v
        .Initialize({
            name: 'finalLocations',
            errorMessage: 'Please provide at least one location',
        })
        .exists()
        .getResult()

    const priceResult = v
        .Initialize({
            name: 'tourPrice',
            errorMessage: 'Tour price must be more than $0',
        })
        .exists()
        .isValue({ min: 1 })
        .getResult()

    const paxResult = v
        .Initialize({
            name: 'tourPax',
            errorMessage: 'Tour Pax must be at least 1',
        })
        .exists()
        .isValue({ min: 1 })
        .getResult()

    const revResult = v
        .Initialize({
            name: 'tourRevision',
            errorMessage: 'Tour Revision cannot be negative',
        })
        .exists()
        .isValue({ min: 0 })
        .getResult()

    const validationErrors = removeNull([
        nameResult,
        descResult,
        durationResult,
        timingResult,
        dayResult,
        itineraryResult,
        locationResult,
        priceResult,
        paxResult,
        revResult,
    ])

    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/listing/edit/${req.params.savedId}`)
    } else {
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        Shop.update(
            {
                tourTitle: req.fields.tourTitle,
                tourDesc: req.fields.tourDesc,
                tourDuration: req.fields.tourDuration,
                tourPrice: req.fields.tourPrice,
                tourPax: req.fields.tourPax,
                tourRevision: req.fields.tourRevision,
                finalTimings: req.fields.finalTimings,
                finalDays: req.fields.finalDays,
                finalItinerary: req.fields.finalItinerary,
                finalLocations: req.fields.finalLocations,
            },
            {
                where: { id: req.params.savedId },
            },
        )
            .then(async (data) => {
                const doc = {
                    id: req.params.savedId,
                    name: req.fields.tourTitle,
                    description: req.fields.tourDesc,
                }
                console.log(doc['id'])

                await elasticSearchHelper.updateDoc(doc)

                res.redirect(`/listing/info/${req.params.savedId}`)
            })
            .catch((err) => {
                console.log(err)
            })
    }

    const AccDetails = {
        'name': req.fields.name,
        'email': req.fields.email,
        'phone_number': req.fields.phone_number,
        'fb': req.fields.fb,
        'insta': req.fields.insta,
        'li': req.fields.li,
    }

    updateDB('user', { 'id': user.id }, AccDetails, () => {
    })
})





router.get('/setting/password', (req, res) => {
    const metadata = {
        meta: {
            title: 'Password',
            path: false,
        },
        nav: {
            sidebarActive: 'password',
        },
        layout: 'setting',
    }
    return res.render('users/password.hbs', metadata)
})

router.get('/messages', (req, res) => {
    const metadata = {
        meta: {
            title: 'Your messages',
            path: false,
        },
        nav: {
            navbar: 'chat',
            sidebarActive: 'aa',
        },
        layout: 'chat',
    }
    return res.render('chat.hbs', metadata)
})


module.exports = router
