const express = require('express')
const fs = require('fs')
const { default: axios } = require('axios')
const uuid = require('uuid')
const path = require('path')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const genkan = require('../app/genkan/genkan')
const { convert } = require('image-file-resize')
const cookieParser = require('cookie-parser')

const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray } = require('../app/helpers')

// Config file
const config = require('../config/apikeys.json')

// Globals
const router = express.Router()
const { User } = require('../models')

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator

const savedImageFolder = './storage/users'

require('../app/db')

router.use(formidable())
router.use(cookieParser('Please change this when in production use'))

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
    const sid = req.signedCookies.sid
    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        return requireLogin(res)
    }

    if (req.cookies.storedValues) {
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }

    const user = await genkan.getUserBySessionAsync(sid)
    return res.render('users/general.hbs', {
        meta: {
            title: 'General Setting',
            path: false,
        },
        nav: {
            sidebarActive: 'general',
        },
        layout: 'setting',
        user,
        settingErrors: req.cookies.settingErrors,
    })
})

router.post('/setting/general', async (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const sid = req.signedCookies.sid
    if (sid == undefined) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
        return requireLogin(res)
    }

    const user = await genkan.getUserBySessionAsync(sid)
    const v = new Validator(req.fields)
    const nameResult = v
        .Initialize({ name: 'uname', errorMessage: 'Name must be at least 3 characters long' })
        .exists()
        .isLength({ min: 3 })
        .getResult()

    const phoneResult = v
        .Initialize({ name: 'phone_number', errorMessage: 'Phone number must be 8 characters long' })
        .isLength({ min: 8, max: 8 })
        .getResult()

    const fbResult = v
        .Initialize({ name: 'fb', errorMessage: 'Invalid Facebook link' })
        .contains('facebook.com')
        .getResult()

    const instaResult = v
        .Initialize({ name: 'insta', errorMessage: 'Invalid Instagram link' })
        .contains('instagram.com')
        .getResult()

    const liResult = v
        .Initialize({ name: 'li', errorMessage: 'Invalid LinkedIn link' })
        .contains('linkedin.com/in')
        .getResult()

    const settingErrors = removeNull([nameResult, phoneResult, fbResult, instaResult, liResult])

    if (!emptyArray(settingErrors)) {
        res.cookie('settingErrors', settingErrors, { maxAge: 5000 })
        res.redirect(`/u/setting/general`)
    } else {
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        const AccDetails = {
            'name': req.fields.name,
            'email': req.fields.email,
            'phone_number': req.fields.phone_number,
            'fb': req.fields.fb,
            'insta': req.fields.insta,
            'li': req.fields.li,
        }
        updateDB('user', { 'id': user.id }, AccDetails, () => {
            return res.redirect(`/u/setting/general`)
        })
    }
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
