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
const elasticSearchHelper = require('../app/elasticSearch')

const esClient = require('../app/elasticSearch').esClient

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator

const savedpfpFolder = './storage/users'

require('../app/db')

router.use(formidable())
router.use(cookieParser('Please change this when in production use'))


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
    const userID = req.params.id

    User.findAll({
        where: {
            id: userID,
        },
    })
        .then(async (items) => {
            const uData = await items[0]['dataValues']
            console.log(uData)
            const sid = req.signedCookies.sid

            // If person is not logged in
            if (sid == undefined) {
                return res.render('profile.hbs', {
                    uData: uData,
                    isOwner: false,
                })
            } else {
                // Check if session is up to date. Else, require person to reloggin
                if ((await genkan.isLoggedinAsync(sid)) == false) {
                    // Redirect to login page
                    return requireLogin(res)
                }
                if (req.cookies.storedValues) {
                    const storedValues = JSON.parse(req.cookies.storedValues)
                } else {
                    const storedValues = {}
                }
                // If user is logged in and has a valid session
                const userData = await genkan.getUserBySessionAsync(sid)

                // Check if user is the owner of the current listing being browsed
                const isOwner = userData.id == uData.id
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
                        uData: uData,
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
                        uData: uData,
                        isOwner: owner,
                    }
                    return res.render('users/profile.hbs', metadata)
                }
            }
        })
        .catch((err) => console.log)
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

    const bioErrors = []
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
    }
    return res.render('users/general.hbs', metadata)
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
    // const fv = new fileValidator(req.files['profile_img'])
    settingErrors = []
    const nameResult = v
        .Initialize({ name: 'uname', errorMessage: 'Name must be at least 3 characters long' })
        .exists()
        .isLength({ min: 3 })
        .getResult()
    settingErrors.push(nameResult)
    // const pfpResult = fv
    //     .Initialize({ errorMessage: 'Please supply a valid Image' })
    //     .fileExists()
    //     .sizeAllowed({ maxSize: 5000000 })
    //     .getResult()

    if (req.fields.phone_number == '') {
    } else {
        const phoneResult = v
            .Initialize({ name: 'phone_number', errorMessage: 'Phone number must be 8 characters long' })
            .isLength({ min: 8, max: 8 })
            .getResult()
        settingErrors.push(phoneResult)
    }

    if (req.fields.fb == '') {
    } else {
        const fbResult = v
            .Initialize({ name: 'fb', errorMessage: 'Invalid Facebook link' })
            .contains('facebook.com')
            .getResult()
        settingErrors.push(fbResult)
    }

    if (req.fields.insta == '') {
    } else {
        const instaResult = v
            .Initialize({ name: 'insta', errorMessage: 'Invalid Instagram link' })
            .contains('instagram.com')
            .getResult()
        settingErrors.push(instaResult)
    }

    if (req.fields.li == '') {
    } else {
        const liResult = v
            .Initialize({ name: 'li', errorMessage: 'Invalid LinkedIn link' })
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

        const AccDetails = {
            'name': req.fields.uname,
            'email': req.fields.email,
            'phone_number': req.fields.phone_number,
            'fb': req.fields.fb,
            'insta': req.fields.insta,
            'li': req.fields.li,
        }
        updateDB('user', { 'id': user.id }, AccDetails, () => {
            return res.redirect(`/u/setting/general`)
        })
        // let filePath = req.files['profile_img']['path']
        // let fileName = req.files['profile_img']['name']
        // const saveFolder = savedpfpFolder
        // const savedName = storeImage(
        //     (filePath = filePath),
        //     (fileName = fileName),
        //     (folder = saveFolder),
        // )
        // console.log(`Added file is ${savedName}`)
        // User.findAll({
        //     where: {
        //         id: user.id,
        //     },
        // }).then((items) => {
        //     const savedpfpFile = items[0]['dataValues']['profile_img']
        //     if (savedpfpFile != 'default.jpg') {
        //         console.log(`Removed IMAGE FILE: ${savedpfpFile}`)
        //         fs.unlinkSync(`${savedpfpFolder}/${savedpfpFile}`)
        //     }
        // })

        // User.update(
        //     {
        //         name: req.fields.name,
        //         email: req.fields.email,
        //         phone_number: req.fields.phone_number,
        //         profile_img: savedName,
        //         fb: req.fields.fb,
        //         insta: req.fields.insta,
        //         li: req.fields.li,
        //     },
        //     {
        //         where: { id: user.id },
        //     },
        // )
        //     .catch((err) => {
        //         console.log(err)
        //     })
        //     .then(async (data) => {
        //         // Update elastic search
        //         const doc = {
        //             id: user.id,
        //             image: savedName,
        //         }

        //         await elasticSearchHelper.updateImage(doc)

        //         res.redirect(`/u/setting/general`)
        //     })
        //     .catch((err) => {
        //         console.log(err)
        //     })
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
