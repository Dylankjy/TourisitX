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
const { User, Shop } = require('../models')
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

    const userD = await User.findAll({
        where: {
            'id': req.params.id,
        }
    })
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        where: {
            'userId': req.params.id,
        }
    }).then(async (data) => {
        await data.forEach((doc) => {
            listings.push(doc['dataValues'])
        })
        return listings
        // return res.render('marketplace.hbs', { listings: listings })
    })


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
    console.log('Tours', listings)
    const isOwner = userD.id == req.currentUser.id

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
                
            },
            listings: listings,
            uData: userD,
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
            },
            listings: listings,
            uData: userD,
            isOwner: owner,
        }
        return res.render('users/profile.hbs', metadata)
    }

})

router.post('/profile/:id', async (req, res) => {
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

    bioErrors = []
    if (req.fields.bio == '') {
    } else {
        const bioResult = v
            .Initialize({ name: 'bio', errorMessage: 'Bio must be less than 200 characters' })
            .isLength({ max: 200 })
            .getResult()
        bioErrors.push(bioResult)
    }

    bioErrors = removeNull(bioErrors)

    if (!emptyArray(bioErrors)) {
        res.cookie('bioErrors', bioErrors, { maxAge: 5000 })
        res.redirect(`/u/profile/${req.params.id}`)
    } else {
        res.clearCookie('bioErrors')
        res.clearCookie('storedValues')

        const bioDetails = {
            'bio': req.fields.bio,
        }
        updateDB('user', { 'id': user.id }, bioDetails, () => {
            return res.redirect(`/u/profile/${req.params.id}`)
        })
    }
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

    const user = await genkan.getUserBySessionAsync(sid)
    if (user.is_tourguide == 0) {
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

    const user = await genkan.getUserBySessionAsync(sid)
    const v = new Validator(req.fields)
    // const fv = new fileValidator(req.files['pfp'])
    settingErrors = []
    const nameResult = v
        .Initialize({
            name: 'uname',
            errorMessage: 'Name must be at least 3 characters long',
        })
        .exists()
        .isLength({ min: 3 })
        .getResult()
    settingErrors.push(nameResult)

    const emailData = await User.findAll({
        where: {
            'email': req.fields.user_email,
        }
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

    const user = await genkan.getUserBySessionAsync(sid)
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
        const newResult = v
            .Initialize({
                name: 'new',
                errorMessage: 'Both passwords do not match',
            })
            .exists()
            .getResult()

        const repeatResult = v
            .Initialize({
                name: 'confirm',
                errorMessage: 'Both passwords do not match',
            })
            .exists()
            .isLength({ min: 8 })
            .isEqual(req.fields.new)
            .getResult()

        const passwordErrors = removeNull([newResult, repeatResult])
        // SHA512 Hashing
        const incomingHashedPasswordSHA512 = sha512({
            a: req.fields.old_password,
            b: config.genkan.secretKey,
        })

        result = bcrypt.compareSync(incomingHashedPasswordSHA512, user.password)

        if (result === true && emptyArray(passwordErrors)) {
            res.clearCookie('passwordErrors')
            res.clearCookie('storedValues')
            // do password change
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


module.exports = router
