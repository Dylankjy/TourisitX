const express = require('express')
const fs = require('fs')
const { default: axios } = require('axios')
const uuid = require('uuid')
const path = require('path')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const genkan = require('../app/genkan/genkan')
const { convert } = require('image-file-resize')

const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray } = require('../app/helpers')

// Config file
const config = require('../config/genkan.json')

// Globals
const router = express.Router()
const { Support } = require('../models')

const Validator = formidableValidator.Validator


// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const { findDB, insertDB } = require('../app/db')

require('../app/db')

router.use(formidable())

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/', async (req, res) => {
    const sid = req.signedCookies.sid
    if (sid == undefined) {
        return requireLogin(res)
    } else if ((await genkan.isLoggedinAsync(sid)) == false) {
        return requireLogin(res)
    }

    if (req.cookies.storedValues) {
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }

    const user = await genkan.getUserBySessionAsync(sid)

    const metadata = {
        meta: {
            title: 'Support',
            path: false,
        },
        data: {
            currentUser: req.currentUser,
        },
        user,
        supportErrors: req.cookies.supportErrors,
        successSupport: req.cookies.successSupport,
    }
    return res.render('support.hbs', metadata)
})

router.post('/', async (req, res) => {
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
    // const fv = new fileValidator(req.files['pfp'])
    supportErrors = []

    const contentResult = v
        .Initialize({
            name: 'content',
            errorMessage: 'Content must not be empty and not longer than 254 characters',
        })
        .exists()
        .isLength({ min: 10, max: 254 })
        .getResult()
    supportErrors.push(contentResult)
    supportErrors = removeNull(supportErrors)

    if (!emptyArray(supportErrors)) {
        res.cookie('supportErrors', supportErrors, { maxAge: 5000 })
        res.redirect(`/helpdesk`)
    } else {
        res.clearCookie('supportErrors')
        res.clearCookie('storedValues')

        successSupport = []
        const formS = v
            .Initialize({
                errorMessage: 'We will get back to you ASAP :)',
            })
            .setFalse()
            .getResult()

        successSupport.push(formS)
        res.cookie('successSupport', successSupport, { maxAge: 5000 })

        const gentId = uuid.v4()

        const TicketDetails = {
            'ticket_id': gentId,
            'uid': user.id,
            'u_email': user.email,
            'support_type': req.fields.type,
            'content': req.fields.content,
            'status': 'Open',
            'createdAt': new Date(),
            'updatedAt': new Date(),
        }
        insertDB('support', TicketDetails, () => {
            return res.redirect('/helpdesk')
        })
    }
})

module.exports = router
