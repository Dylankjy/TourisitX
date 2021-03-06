const express = require('express')
const fs = require('fs')
const { default: axios } = require('axios')
const uuid = require('uuid')
const path = require('path')
const { Op } = require('sequelize')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const genkan = require('../app/genkan/genkan')
const { convert } = require('image-file-resize')

const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray } = require('../app/helpers')

// Config file
const config = require('../config/genkan.json')

// Globals
const router = express.Router()
const { User, Shop, Review } = require('../models')
const elasticSearchHelper = require('../app/elasticSearch')

const esClient = require('../app/elasticSearch').esClient

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator

const savedpfpFolder = './storage/users'

// Hashing
const sha512 = require('hash-anything').sha512
const bcrypt = require('bcrypt')
const { findDB } = require('../app/db')

require('../app/db')

const Vibrant = require('node-vibrant')

const apiConfig = require('../config/apikeys.json')


const STRIPE_PUBLIC_KEY = apiConfig.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = apiConfig.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)

router.use(formidable())

imageToB64Callback = (filePath, fileType, callback) => {
    fs.readFile(filePath, (err, data) => {
        const base64 = Buffer.from(data).toString('base64')
        // var formattedSrc = `<img src="data:${fileType};base64, ${base64}">`
        fileType = fileType.replace('.', '')
        const formattedSrc = `data:image/${fileType};base64, ${base64}`

        callback(formattedSrc)
        // console.log(base64)
    })
}

storeImage = (filePath, fileName, folder) => {
    const imgName = uuid.v4()

    const fileExt = path.extname(fileName)
    const savedName = `${imgName}${fileExt}`
    const savedPath = `${folder}/${imgName}${fileExt}`

    const data = fs.readFileSync(filePath)
    const imgBuffer = Buffer.from(data)

    fs.writeFileSync(savedPath, imgBuffer)

    return savedName
}
// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile/:id', async (req, res) => {
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

    const userD = await User.findAll({
        where: {
            'id': req.params.id,
        },
    })

    const custR = []
    const tgR = []

    // Tour Guide
    Review.findAll({
        attributes: ['id', 'type', 'reviewText', 'rating', 'createdAt', 'subjectId', 'reviewerId'],
        where: {
            'subjectId': req.params.id,
            'type': 'TOUR',
        },
        include: [{
            model: User, as: 'Reviewer',
            attributes: ['name', 'profile_img'],
        },
        {
            model: Shop,
            attributes: ['tourTitle'],
        }],
    }).then(async (data) => {
        await data.forEach((doc) => {
            tgR.push(doc['dataValues'])
        })
        return tgR
    }).then(async (tgR) => {
        console.log('TgReview', tgR)
    }).catch((err) => {
        console.log(err)
        res.json({ 'Message': 'Failed' })
    })

    // Customer
    Review.findAll({
        attributes: ['id', 'type', 'reviewText', 'rating', 'createdAt', 'reviewerId'],
        where: {
            'reviewerId': req.params.id,
        },
        include: [{
            model: User, as: 'Reviewer',
            attributes: ['name', 'profile_img'],
        },
        {
            model: Shop,
            attributes: ['tourTitle'],
        }],
    }).then(async (data) => {
        await data.forEach((doc) => {
            custR.push(doc['dataValues'])
        })
        return custR
    }).then(async (custR) => {
        console.log('CustReview', custR)
    }).catch((err) => {
        console.log(err)
        res.json({ 'Message': 'Failed' })
    })

    const isOwner = req.currentUser.id == userD[0]['dataValues'].id
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        where: {
            'userId': req.params.id,
        },
    }).then(async (data) => {
        await data.forEach((doc) => {
            listings.push(doc['dataValues'])
        })
        return listings
    }).then(async (listings) => {
        console.log('Tours', listings)

        let pageColor = [0, 0, 0]
        try {
            pageColor = (await Vibrant.from(`./storage/users/${userD[0].dataValues.profile_img}`).getPalette()).DarkMuted._rgb
        } catch (err) {
            console.error(err)
        }

        if (isOwner) {
            // Manually set to true now.. while waiting for the validation library
            owner = true
            const metadata = {
                meta: {
                    title: 'Profile',
                    path: false,
                },
                data: {
                    currentUser: req.currentUser,
                    pageColor,
                },
                tgreviews: tgR,
                ureviews: custR,
                listings: listings,
                uData: userD[0]['dataValues'],
                isOwner: owner,
                bioErrors: req.cookies.bioErrors,
            }
            return res.render('users/profile.hbs', metadata)
        } else {
            owner = false
            const metadata = {
                meta: {
                    title: 'Profile',
                    path: false,
                },
                data: {
                    currentUser: req.currentUser,
                    pageColor,
                },
                tgreviews: tgR,
                ureviews: custR,
                listings: listings,
                uData: userD[0]['dataValues'],
                isOwner: owner,
            }
            return res.render('users/profile.hbs', metadata)
        }
    }).catch((err) => {
        console.log(err)
        res.json({ 'Message': 'Failed' })
    })
})

router.get('/setting/general', async (req, res) => {
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
    const user = req.currentUser
    if (req.currentUser.is_tourguide == 0) {
        const metadata = {
            meta: {
                title: 'General Setting',
                path: false,
            },
            nav: {
                sidebarActive: 'general',
            },
            layout: 'setting',
            data: {
                currentUser: req.currentUser,
            },
            user,
            settingErrors: req.cookies.settingErrors,
            successMsg: req.cookies.successMsg,
        }
        return res.render('users/general.hbs', metadata)
    } else {
        const metadata = {
            meta: {
                title: 'General Setting',
                path: false,
            },
            nav: {
                sidebarActive: 'general',
            },
            layout: 'setting',
            data: {
                currentUser: req.currentUser,
            },
            user,
            settingErrors: req.cookies.settingErrors,
            successMsg: req.cookies.successMsg,
        }
        return res.render('users/general.hbs', metadata)
    }
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

    const user = req.currentUser
    const v = new Validator(req.fields)
    // const fv = new fileValidator(req.files['pfp'])
    settingErrors = []
    if (req.fields.uname.toLowerCase() == 'system' || req.fields.uname.toLowerCase() == 'system admin' || req.fields.uname.toLowerCase() == 'staff' ||
        req.fields.uname.toLowerCase() == 'ghost' || req.fields.uname.toLowerCase() == 'adminstrator' || req.fields.uname.toLowerCase() == 'admin'
    ) {
        const illegalName = v
            .Initialize({
                name: 'uname',
                errorMessage: 'Name should not contain staff / system / admin / system admin / ghost / adminstrator',
            })
            .exists()
            .setFalse()
            .getResult()
        settingErrors.push(illegalName)
    } else {
        const nameResult = v
            .Initialize({
                name: 'uname',
                errorMessage: 'Name must be at least 3 characters long and not more than 30 characters',
            })
            .exists()
            .isLength({ min: 3, max: 32 })
            .getResult()
        settingErrors.push(nameResult)
    }


    const emailData = await User.findAll({
        where: {
            'email': req.fields.user_email,
        },
    })

    if ((emailData == '') || (req.fields.user_email == user.email) || (req.fields.user_email.includes('@tourisit.local') == false)) {
        console.log('OK GOOD TO GO')
    } else {
        console.log('Email error')
        const emailResult = v
            .Initialize({
                name: 'user_email',
                errorMessage: 'This email address has already been taken',
            })
            .setFalse()
            .getResult()
        settingErrors.push(emailResult)
    }


    if (req.fields.phone_number == '') {
    } else {
        const phoneResult = v
            .Initialize({
                name: 'phone_number',
                errorMessage: 'Phone number must be 8 characters long',
            })
            .isLength({ min: 8, max: 8 })
            .getResult()
        settingErrors.push(phoneResult)
    }

    if (req.fields.user_bio == '') {
    } else {
        const bioResult = v
            .Initialize({ name: 'user_bio', errorMessage: 'Bio must be less than 250 characters' })
            .isLength({ max: 250 })
            .getResult()
        settingErrors.push(bioResult)
    }

    if (req.fields.fb == '') {
    } else {
        const fbResult = v
            .Initialize({
                name: 'fb',
                errorMessage: 'Invalid Facebook link',
            })
            .contains('facebook.com')
            .getResult()
        settingErrors.push(fbResult)
    }

    if (req.fields.insta == '') {
    } else {
        const instaResult = v
            .Initialize({
                name: 'insta',
                errorMessage: 'Invalid Instagram link',
            })
            .contains('instagram.com')
            .getResult()
        settingErrors.push(instaResult)
    }

    if (req.fields.li == '') {
    } else {
        const liResult = v
            .Initialize({
                name: 'li',
                errorMessage: 'Invalid LinkedIn link',
            })
            .contains('linkedin.com/in')
            .getResult()
        settingErrors.push(liResult)
    }

    settingErrors = removeNull(settingErrors)

    if (!emptyArray(settingErrors)) {
        res.cookie('settingErrors', settingErrors, { maxAge: 5000 })
        res.redirect(`/u/setting/general`)
    } else {
        res.clearCookie('settingErrors')
        res.clearCookie('storedValues')
        successMsg = []
        const formU = v
            .Initialize({
                errorMessage: 'Account Information updated successfully',
            })
            .setFalse()
            .getResult()
        successMsg.push(formU)
        res.cookie('successMsg', successMsg, { maxAge: 5000 })
        if (req.fields.mode == 'true') {
            const AccDetails = {
                'name': req.fields.uname,
                'email': req.fields.user_email,
                'phone_number': req.fields.phone_number,
                'is_tourguide': 1,
                'bio': req.fields.user_bio,
                'fb': req.fields.fb,
                'insta': req.fields.insta,
                'li': req.fields.li,
            }
            updateDB('user', { 'id': user.id }, AccDetails, () => {
                return res.redirect(`/u/setting/general`)
            })
        } else {
            const AccDetails = {
                'name': req.fields.uname,
                'email': req.fields.user_email,
                'phone_number': req.fields.phone_number,
                'is_tourguide': 0,
                'bio': req.fields.user_bio,
                'fb': req.fields.fb,
                'insta': req.fields.insta,
                'li': req.fields.li,
            }
            updateDB('user', { 'id': user.id }, AccDetails, () => {
                return res.redirect(`/u/setting/general`)
            })
        }
    }
})


router.get('/setting/password', async (req, res) => {
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

    const user = req.currentUser
    const metadata = {
        meta: {
            title: 'Password',
            path: false,
        },
        nav: {
            sidebarActive: 'password',
        },
        layout: 'setting',
        data: {
            currentUser: req.currentUser,
        },
        user,
        passwordErrors: req.cookies.passwordErrors,
        passwordSuccess: req.cookies.passwordSuccess,
    }
    return res.render('users/password.hbs', metadata)
})

router.post('/setting/password', async (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const sid = req.signedCookies.sid
    if (sid == undefined) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
        return requireLogin(res)
    }

    const v = new Validator(req.fields)
    genkan.getUserBySessionDangerous(sid, (user) => {
        // SHA512 Hashing
        const incomingHashedPasswordSHA512 = sha512({
            a: req.fields.old_password,
            b: config.genkan.secretKey,
        })
        passwordErrors = []
        result = bcrypt.compareSync(incomingHashedPasswordSHA512, user.password)
        if (result === false) {
            const oldResult = v
                .Initialize({
                    name: 'old_password',
                    errorMessage: 'Wrong password, please try again',
                })
                .setFalse()
                .getResult()
            passwordErrors.push(oldResult)
        } else if (req.fields.new.length < 8) {
            const repeatResult = v
                .Initialize({
                    name: 'new',
                    errorMessage: 'New password should be more than 8 characters',
                })
                .exists()
                .isLength({ min: 8 })
                .isEqual(req.fields.new)
                .getResult()
            passwordErrors.push(repeatResult)
        } else if (req.fields.new != req.fields.confirm) {
            const confirmResult = v
                .Initialize({
                    name: 'new',
                    errorMessage: 'Both passwords do not match, please try again',
                })
                .exists()
                .isEqual(req.fields.confirm)
                .getResult()
            passwordErrors.push(confirmResult)
        }

        passwordErrors = removeNull(passwordErrors)
        if (result === true && emptyArray(passwordErrors)) {
            res.clearCookie('passwordErrors')
            res.clearCookie('storedValues')
            // do password change
            passwordSuccess = []
            const formP = v
                .Initialize({
                    errorMessage: 'Password changed successfully',
                })
                .setFalse()
                .getResult()
            passwordSuccess.push(formP)
            res.cookie('passwordSuccess', passwordSuccess, { maxAge: 5000 })
            genkan.setPassword(sid, req.fields.new, () => {
                res.redirect(`/u/setting/password`)
                return callback(true)
            })
        } else {
            res.cookie('passwordErrors', passwordErrors, { maxAge: 5000 })
            res.redirect(`/u/setting/password`)
        }
    })
})

router.post('/profile/edit/:savedId', (req, res) => {
    console.log('Image edited')
    const v = new fileValidator(req.files['profile_img'])
    const imageResult = v
        .Initialize({ errorMessage: 'Please supply a valid Image' })
        .fileExists()
        .sizeAllowed({ maxSize: 5000000 })
        .getResult()

    // Upload is successful
    if (imageResult == null) {
        let filePath = req.files['profile_img']['path']
        let fileName = req.files['profile_img']['name']
        const saveFolder = savedpfpFolder
        const savedName = storeImage(
            (filePath = filePath),
            (fileName = fileName),
            (folder = saveFolder),
        )
        console.log(`Added file is ${savedName}`)

        const imgDetails = {
            'profile_img': savedName,
        }
        updateDB('user', { 'id': req.params.savedId }, imgDetails, () => {
            return res.redirect(`/u/profile/${req.params.savedId}`)
        })
    } else {
        const errMsg = imageResult.msg
        console.log('Failed')
        res.cookie('imageValError', errMsg, { maxAge: 5000 })
        res.redirect(`/u/profile/${req.params.savedId}`)
    }
})


router.get('/profile/:savedId/transaction-history', async (req, res)=> {
    const currentUser = req.currentUser
    const currentUserID = currentUser.Id
    // if (currentUserID != req.params.savedId) {
    //     console.log(currentUserID)
    //     console.log(req.params.savedId)
    //     return res.redirect('/')
    // }

    stripe.paymentIntents.list({
        customer: currentUser.stripe_customer_id,
    })
        .then((paymentHistory)=> {
            paymentHistory = paymentHistory['data']

            const metadata = {
                meta: {
                    title: 'Transaction History',
                    path: false,
                },
                // layout: 'tourguid',
                data: {
                    currentUser: req.currentUser,
                    history: paymentHistory,
                },
            }

            res.render('users/transaction-history.hbs', metadata)
        })
        .catch((err)=> {
            console.log(err)
            const metadata = {
                meta: {
                    title: 'Transaction History',
                    path: false,
                },
                // layout: 'tourguid',
                data: {
                    currentUser: req.currentUser,
                    history: [],
                },
            }

            res.render('users/transaction-history.hbs', metadata)
        })
})

router.post('/setting/set_accmode_welcome', (req, res) => {
    const { accountMode } = req.fields

    if (accountMode === 'USER') {
        User.update({ 'is_tourguide': false }, {
            where: {
                id: req.currentUser.id,
            },
        }).then((data) => {
            return res.redirect(`/`)
        })
    }

    if (accountMode === 'TOURGUIDE') {
        User.update({ 'is_tourguide': true }, {
            where: {
                id: req.currentUser.id,
            },
        }).then((data) => {
            return res.redirect(`/`)
        })
    }

    return false
})

module.exports = router
