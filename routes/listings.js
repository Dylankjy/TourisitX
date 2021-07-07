const express = require('express')
const fs = require('fs')
const { default: axios } = require('axios')
const uuid = require('uuid')
const path = require('path')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const genkan = require('../app/genkan/genkan')
const cookieParser = require('cookie-parser')
const { convert } = require('image-file-resize')

const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray } = require('../app/helpers')

// Config file
const config = require('../config/apikeys.json')

// Globals
const router = express.Router()
const { Shop, User, Ban, Booking, ChatRoom, ChatMessages } = require('../models')
const elasticSearchHelper = require('../app/elasticSearch')
// const esClient = elasticSearch.Client({
//     host: 'http://47.241.14.108:9200',
// })
const { addRoom, addMessage } = require('../app/chat/chat.js')
const { insertDB, updateDB, deleteDB, findDB } = require('../app/db.js')

const TIH_API_KEY = config.secret.TIH_API_KEY
const STRIPE_PUBLIC_KEY = config.stripe.STRIPE_PUBLIC_KEY
const STRIPE_SECRET_KEY = config.stripe.STRIPE_SECRET_KEY

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const esClient = require('../app/elasticSearch').esClient

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator

const savedImageFolder = './storage/listings'

router.use(formidable())
router.use(cookieParser(require('../config/genkan.json').genkan.secretKey))
// bin\elasticsearch.bat

// Will convert Image to base64.

// Callback implementation
// imageToB64(filePath, fileType, (data)=>{
//     fs.writeFile(toPath, data, err=>{if (err) throw err})
// })
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

// Promise implementation
// imageToB64(filePath, fileType).then(data=>console.log(data))
imageToB64Promise = (filePath, fileType) => {
    return new Promise((res, rej) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                rej(err)
            }
            const base64 = Buffer.from(data).toString('base64')
            // var formattedSrc = `<img src="data:${fileType};base64, ${base64}">`
            // Remove the . from ".jpg" -- for rendering the base64 string image
            fileType = fileType.replace('.', '')
            const formattedSrc = `data:image/${fileType};base64, ${base64}`
            res(formattedSrc)
        })
    })
}

// Get and save the B64 encoded image using callback
// getImage = (req, callback) => {
//     const filePath = req.files['resume']['path']
//     const fileType = req.files['resume']['type']
//     imageToB64Promise(filePath, fileType).then((data) => {
//         // Do all your database stuff here also
//         callback(data)
//         // fs.writeFile(toPath, data, err=>{if (err) throw err})
//     }).catch((err) => {
//         console.log(err)
//     })
// }

getImage = (req, callback) => {
    const filePath = req.files['resume']['path']
    const fileType = req.files['resume']['type']
    imageToB64Promise(filePath, fileType)
        .then((data) => {
            // Do all your database stuff here also
            // fs.writeFile(toPath, data, err=>{if (err) throw err})
        })
        .catch((err) => {
            console.log(err)
        })
}

resizeImage = (file, width, height, type) => {
    return new Promise((resolve, reject) => {
        convert({
            file: file,
            width: width,
            height: height,
            type: type,
        })
            .then((data) => {
                resolve(data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

// To save image to specified folder. A UUID will be given as name
// filePath -- received path; fileName - name of local file; folder - folder to save image to
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

// Show the user all of their own listings
router.get('/', (req, res) => {
    res.redirect('/tourguide/manage/listings')
})

// To get a specific listing
router.get('/info/:id', (req, res) => {
    const itemID = req.params.id

    Shop.findAll({
        where: {
            id: itemID,
        },
    })
        .then(async (items) => {
            const tourData = await items[0]['dataValues']
            console.log(tourData)
            const sid = req.signedCookies.sid

            // If person is not logged in
            if (sid == undefined) {
                return res.render('listing.hbs', {
                    tourData: tourData,
                    isOwner: false,
                })
            } else {
                // Check if session is up to date. Else, require person to reloggin
                if ((await genkan.isLoggedinAsync(sid)) == false) {
                // Redirect to login page
                    return requireLogin(res)
                }

                // If user is logged in and has a valid session
                const userData = await genkan.getUserBySessionAsync(sid)
                const userWishlist = userData.wishlist || ''
                console.log(`userWishlist is: ${userWishlist}`)
                // var userWishlistArr = userWishlist.split(';!;')

                // Check if user is the owner of the current listing being browsed
                const isOwner = userData.id == tourData.userId
                if (isOwner) {
                    owner = true
                    const errMsg = req.cookies.imageValError || ''

                    let banStatus = ''
                    const banLog = await Ban.findAll({ where: { objectID: itemID, is_inForce: true } })

                    if (banLog[0] == undefined) {
                        banStatus = false
                    } else {
                        const currentlyBanned = banLog[0]['dataValues']['is_inForce']

                        if (currentlyBanned == true) {
                            banStatus = true
                        } else {
                            banStatus = false
                        }
                    }

                    const metadata = {
                        tourData: tourData,
                        isOwner: owner,
                        errMsg: errMsg,
                        wishlistArr: userWishlist,
                        bannedStatus: banStatus,
                        data: {
                            currentUser: req.currentUser,
                        },
                    }

                    console.log(metadata)

                    return res.render('listing.hbs', metadata)
                } else {
                    owner = false

                    const metadata = {
                        data: {
                            currentUser: req.currentUser,
                        },
                        tourData: tourData,
                        isOwner: owner,
                        wishlistArr: userWishlist,
                    }

                    return res.render('listing.hbs', metadata)
                }
            }
        })
        .catch((err) => console.log)
})

// can we use shards? (Like how we did product card that time, pass in a json and will fill in the HTML template)
// To create the listing
router.get('/create', async (req, res) => {
    const sid = req.signedCookies.sid

    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return requireLogin(res)
    }

    // If you have to re-render the page due to errors, there will be cookie storedValue and you use this
    // To use cookie as JSON in javascipt, must URIdecode() then JSON.parse() it
    if (req.cookies.storedValues) {
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }

    const metadata = {
        validationErrors: req.cookies.validationErrors,
        layout: 'tourGuide',
        data: {
            currentUser: req.currentUser,
        },
    }

    return res.render('tourGuide/createListing.hbs', metadata)
})

// To create the listing
router.post('/create', async (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const sid = req.signedCookies.sid

    if (sid == null) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    const v = new Validator(req.fields)

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

    // Initialize Image Validator using req.files
    // const imgV = new FileValidator(req.files)
    // let imgResult = imgV.Initialize({ errorMessage: 'Please provide a Tour Image (.png/.jpg allowed < 3MB)'}).fileExists().sizeAllowed({maxSize: 300000}).extAllowed(['.jpg', '.png'])
    // .getResult()

    // Evaluate the files and fields data separately
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

    // If there are errors, re-render the create listing page with the valid error messages
    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/listing/create`)
    } else {
    // If successful
    // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        const genId = uuid.v4()

        Shop.create({
            // You create the uuid when you initialize the create listing
            id: genId,
            // Replace with actual usesrID once the auth library is out
            userId: userData.id,
            tourTitle: req.fields.tourTitle,
            tourDesc: req.fields.tourDesc,
            tourDuration: req.fields.tourDuration,
            tourPrice: parseInt(req.fields.tourPrice),
            tourPax: req.fields.tourPax,
            tourRevision: req.fields.tourRevision,
            finalTimings: req.fields.finalTimings,
            finalDays: req.fields.finalDays,
            finalItinerary: req.fields.finalItinerary,
            finalLocations: req.fields.finalLocations,
            tourImage: 'default.jpg',
            hidden: 'false',
        }).then(async (data) => {
            await axios.post('http://localhost:5000/es-api/upload', {
                id: genId,
                name: req.fields.tourTitle,
                description: req.fields.tourDesc,
                image: 'default.jpg',
            })
        })
            .catch((err) => {
                console.log(err)
            })

        console.log('INSERTED')
        res.redirect(`/listing`)
    }
})

router.get('/edit/:savedId', async (req, res) => {
    const sid = req.signedCookies.sid
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false ) {
    // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)
    Shop.findAll({
        where: {
            id: req.params.savedId,
        },
    })
        .then((items) => {
            const savedData = items[0]['dataValues']
            // Validate that the user can edit the listing
            // if (userID == savedData["userId"])
            const isOwner = userData.id == savedData['userId']
            if (isOwner) {
                res.cookie('storedValues', JSON.stringify(savedData), { maxAge: 5000 })

                const metadata = {
                    validationErrors: req.cookies.validationErrors,
                    data: {
                        currentUser: req.currentUser,
                    },
                }

                return res.render('tourGuide/editListing.hbs', metadata)
            } else {
                // Will return "No perms" screen
                return requirePermission(res)
            }
        })
        .catch((err) => {
            console.log(err)
            res.send('No such listing exists!')
        })
})

// To edit the listing
router.post('/edit/:savedId', (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const v = new Validator(req.fields)

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
                tourPrice: parseInt(req.fields.tourPrice),
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
})


router.get('/hide/:id', (req, res)=>{
    const itemID = req.params.id
    Shop.update(
        {
            hidden: 'true',
        },
        {
            where: { id: itemID },
        },
    )
        .then(()=>{
            deleteDoc('products', itemID)
            res.redirect(`/listing/info/${itemID}`)
        })
})


router.get('/unhide/:id', async (req, res)=>{
    const itemID = req.params.id

    let banStatus = ''
    const banLog = await Ban.findAll({ where: { objectID: itemID, is_inForce: true } })

    if (banLog[0] == undefined) {
        banStatus = false
    } else {
        const currentlyBanned = banLog[0]['dataValues']['is_inForce']

        if (currentlyBanned == true) {
            banStatus = true
        } else {
            banStatus = false
        }
    }

    // If listing is not banned, allow for unhide
    if (banStatus == false) {
        Shop.update(
            {
                hidden: 'false',
            },
            {
                where: { id: itemID },
            },
        )
            .then(()=>{
                Shop.findAll({
                    attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
                    where: { id: itemID },
                }).then(async (data)=>{
                    doc = data[0]['dataValues']
                    console.log('REINSERTING')
                    await axios.post('http://localhost:5000/es-api/upload', {
                        id: doc.id,
                        name: doc.tourTitle,
                        description: doc.tourDesc,
                        image: doc.tourImage,
                    })
                    console.log('REINSERTING SUCCESS')
                    res.redirect(`/listing/info/${itemID}`)
                }).catch((err)=>{
                    console.log('Error Inserting to ES')
                    console.log(err)
                })
            }).catch((err)=>{
                console.log('Error updating DB')
                console.log(err)
            })
    } else {
        res.redirect(`/listing/info/${itemID}`)
    }
})


router.get('/payment/customer/create', async (req, res)=>{
    const sid = req.signedCookies.sid

    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    const cardNumber = '4242424242424242'
    const cvc = '424'

    const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
            number: cardNumber,
            exp_month: 9,
            exp_year: 2022,
            cvc: cvc,
        },
    })

    console.log(paymentMethod)

    const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.name,
        payment_method: paymentMethod.id,
    })

    res.json(customer)
})


router.get('/:id/payment', async (req, res) => {
    const itemID = req.params.id

    const sid = req.signedCookies.sid

    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        // Redirect to login page
        return requireLogin(res)
    }


    // Replace wth res.redirect()
    res.render('tourGuide/payment.hbs', {
        key: 'blahblah',
        payeeName: 'tester',
        tourName: 'Best Tours',
        price: 'Blah Price',
    })
})


router.post('/:id/payment', async (req, res) => {
    const itemID = req.params.id

    const itemData = await Shop.findAll({
        where: {
            id: itemID,
        },
    })

    const tourPrice = itemData[0]['dataValues']['tourPrice'] * 100
    console.log(tourPrice)

    const charge = await stripe.charges.create({
        amount: tourPrice,
        currency: 'sgd',
        source: 'tok_visa',
        description: 'Just testing',
        capture: false,
    })

    console.log(charge.id)

    const capture = await stripe.charges.capture(
        charge.id,
    )
    res.json(capture)
})


router.get('/charges', async (req, res)=>{
    const txs = await stripe.balanceTransactions.list({})
    console.log(txs)
    res.json(txs)
})

router.get('/:id/favourite', async (req, res) => {
    const itemID = req.params.id

    const sid = req.signedCookies.sid

    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)
    const userId = userData.id
    const userWishlist = userData.wishlist
    if (userWishlist == null || userWishlist == '') {
        User.update({
            wishlist: itemID + ';!;',
        }, {
            where: { id: userId },
        }).then((data)=>{
            console.log(data)
            return res.redirect(`/listing/info/${itemID}`)
        })
    } else {
        const userWishlistArr = userWishlist.split(';!;')

        // If item already in wishlist, don't have to proceed.
        if (userWishlistArr.includes(itemID)) {
            res.redirect(`/listing/info/${itemID}`)
        }

        User.update({
            wishlist: userWishlist + itemID + ';!;',
        }, {
            where: { id: userId },
        }).then((data)=>{
            console.log(data)
            res.redirect(`/listing/info/${itemID}`)
        })
    }
})


router.get('/:id/unfavourite', async (req, res) => {
    const itemID = req.params.id

    const sid = req.signedCookies.sid

    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)
    const userId = userData.id

    const userWishlist = userData.wishlist
    const userWishlistArr = userData.wishlist.split(';!;')

    updatedUserWishList = removeFromArray(itemID, userWishlistArr)
    updatedUserWishList = updatedUserWishList.join(';!;')

    User.update({
        wishlist: updatedUserWishList,
    }, {
        where: { id: userId },
    }).then(()=>{
        res.redirect(`/listing/info/${itemID}`)
    })
})


router.get('/tt', async (req, res)=>{
    const sid = req.signedCookies.sid

    const userData = await genkan.getUserBySessionAsync(sid)
    const userId = userData.id
    const userWishlist = userData.wishlist
    const userWishlistArr = userWishlist.split(';!;')
})


router.get('/api/autocomplete/location', (req, res) => {
    console.log(req.query.typedLocation)
    axios
        .get(
            `https://tih-api.stb.gov.sg/map/v1/autocomplete/type/address?input=${req.query.typedLocation}&apikey=${TIH_API_KEY}`,
        )
        .then((data) => {
            console.log(data['data'])
            return res.json(data['data'])
        })
        .catch((err) => {
            console.log(err)
        })
})

router.post('/edit/image/:savedId', (req, res) => {
    console.log('Image edited')
    const v = new fileValidator(req.files['tourImage'])
    const imageResult = v
        .Initialize({ errorMessage: 'Please supply a valid Image' })
        .fileExists()
        .sizeAllowed({ maxSize: 5000000 })
        .getResult()

    // Upload is successful
    if (imageResult == null) {
        let filePath = req.files['tourImage']['path']
        let fileName = req.files['tourImage']['name']
        const saveFolder = savedImageFolder
        const savedName = storeImage(
            (filePath = filePath),
            (fileName = fileName),
            (folder = saveFolder),
        )
        console.log(`Added file is ${savedName}`)

        Shop.findAll({
            where: {
                id: req.params.savedId,
            },
        }).then((items) => {
            const savedImageFile = items[0]['dataValues']['tourImage']
            if (savedImageFile != 'default.jpg') {
                console.log(`Removed IMAGE FILE: ${savedImageFile}`)
                fs.unlinkSync(`${savedImageFolder}/${savedImageFile}`)
            }
        })

        Shop.update(
            {
                tourImage: savedName,
            },
            {
                where: { id: req.params.savedId },
            },
        )
            .catch((err) => {
                console.log(err)
            })
            .then(async (data) => {
                // Update elastic search
                const doc = {
                    id: req.params.savedId,
                    image: savedName,
                }

                await elasticSearchHelper.updateImage(doc)

                res.redirect(`/listing/info/${req.params.savedId}`)
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        const errMsg = imageResult.msg
        console.log('Failed')
        res.cookie('imageValError', errMsg, { maxAge: 5000 })
        res.redirect(`/listing/info/${req.params.savedId}`)
    }
})

router.get('/delete/:savedId', async (req, res) => {
    const itemID = req.params.savedId
    const sid = req.signedCookies.sid
    if (sid == null) {
        return requireLogin(res)
    }
    if ((await genkan.isLoggedinAsync(sid)) == false) {
    // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)

    const listingOwner = await Shop.findAll({
        attributes: ['userId'],
        where: { id: itemID },
    })

    const ownerId = listingOwner[0]['dataValues']['userId']

    if (ownerId != userData.id) {
        console.log('NO PERM TO DELETE')
        return res.redirect(`/listing/info/${req.params.savedId}`)
    }

    // rmb to delete the images too
    Shop.findAll({
        where: {
            id: req.params.savedId,
        },
    }).then((items) => {
        // If logged in user is not the owner, no permission to delete
        // Only delete image from local folder if it is NOT the default image
        const savedImageFile = items[0]['dataValues']['tourImage']
        if (savedImageFile != 'default.jpg') {
            console.log(`Delete listing and Removed IMAGE FILE: ${savedImageFile}`)
            fs.unlinkSync(`${savedImageFolder}/${savedImageFile}`)
        }
    })


    Shop.destroy({
        where: {
            id: req.params.savedId,
        },
    }).then((data) => {
        // Delete from elastic search client
        deleteDoc('products', req.params.savedId)
        res.redirect('/tourguide/manage/listings')
    }).catch((err) => {
        console.log(err)
    })
})

// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

router.get('/api/getImage/:id', (req, res) => {
    const itemID = req.params.id

    Shop.findAll({
        where: {
            id: itemID,
        },
    })
        .then((items) => {
            res.json(items[0]['tourImage'])
        })
        .catch((err) => console.log)
})

// Start: Booking-related items under the listing route
// Rendering the book-now form
router.get('/:id/purchase', async (req, res) => {
    const itemID = req.params.id

    Shop.findAll({
        where: {
            id: itemID,
        },
    })
        .then(async (items) => {
            const tourData = await items[0]['dataValues']
            console.log(tourData)
            const customPrice = (tourData['tourPrice'] / 10).toFixed(2)
            const metadata = {
                meta: {
                    title: 'Book Now - ' + tourData.tourTitle,
                },
                data: {
                    currentUser: req.currentUser,
                    listing: tourData,
                    customPrice: customPrice,
                    validationErrors: req.cookies.validationErrors,
                },
            }
            return res.render('bookNow.hbs', metadata )
        }).catch((err) => {
            throw err
        })
})

// Default booking
router.post('/:id/purchase', async (req, res) => {
    console.log(req.fields)
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const tourID = req.params.id
    const sid = req.signedCookies.sid

    const userData = await genkan.getUserBySessionAsync(sid)
    Shop.findAll({
        where: {
            id: tourID,
        },
    })
        .then(async (items) => {
            const listing = await items[0]['dataValues']

            const v = new Validator(req.fields)

            const tourDateResult = v
                .Initialize({
                    name: 'tourDate',
                    errorMessage: 'Please select a tour date.',
                })
                .exists()
                .getResult()

            const tourTimeResult = v
                .Initialize({
                    name: 'tourTime',
                    errorMessage: 'Please select a tour time.',
                })
                .exists()
                .getResult()

            const bookPaxResult = v
                .Initialize({
                    name: 'tourPax',
                    errorMessage: 'Please select number of participants.',
                })
                .exists()
                .getResult()

            const bookTOCResult = v
                .Initialize({
                    name: 'bookTOC',
                    errorMessage: 'Please agree to the Terms & Conditions before booking a tour.',
                })
                .exists()
                .getResult()

            // // Evaluate the files and fields data separately
            const validationErrors = removeNull([
                tourDateResult,
                tourTimeResult,
                bookPaxResult,
                bookTOCResult,
            ])

            // If there are errors, re-render the create listing page with the valid error messages
            if (!emptyArray(validationErrors)) {
                res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
                res.redirect(`/listing/${tourID}/purchase`)
            } else {
                // If successful
                // Remove cookies for stored form values + validation errors
                res.clearCookie('validationErrors')
                res.clearCookie('storedValues')
                const genId = uuid.v4()

                const rawTourDate = req.fields.tourDate
                const darr = rawTourDate.split('/')

                const rawTourTime = req.fields.tourTime
                const timeArr = rawTourTime.split(' - ')
                const startTimeArr = timeArr[0].split(':')
                const endTimeArr = timeArr[1].split(':')
                formatTime = (arr) => {
                    if (arr[1].slice(-2) == 'PM' && parseInt(arr[0])<12) {
                        arr[0] = parseInt(arr[0]) + 12
                    } else if (arr[1].slice(-2) == 'AM' && parseInt(arr[0])==12) {
                        arr[0] = parseInt(arr[0]) -12
                    }
                    arr[1] = arr[1].slice(0, -3)
                    if (arr[0].toString().length == 1) {
                        arr[0] = '0' + arr[0]
                    }
                }
                formatTime(startTimeArr)
                formatTime(endTimeArr)
                const startTour = new Date(parseInt(darr[2]), parseInt(darr[1])-1, parseInt(darr[0]), parseInt(startTimeArr[0]), parseInt(startTimeArr[1])).toISOString()
                const endTour = new Date(parseInt(darr[2]), parseInt(darr[1])-1, parseInt(darr[0]), parseInt(endTimeArr[0]), parseInt(endTimeArr[1])).toISOString()
                const orderDateTime = new Date().toISOString()

                Booking.create({
                    bookId: genId,
                    custId: userData.id,
                    tgId: listing.userId,
                    listingId: listing.id,
                    chatId: '00000000-0000-0000-0000-000000000000',
                    orderDatetime: orderDateTime,
                    tourStart: startTour,
                    tourEnd: endTour,
                    bookPax: req.fields.tourPax,
                    bookDuration: listing.tourDuration,
                    bookItinerary: listing.finalItinerary,
                    bookBaseprice: listing.tourPrice,
                    bookCharges: 0,
                    // processStep: 0, set to 4 for now until approval & payment system is in place
                    processStep: 4,
                    revisions: listing.tourRevision,
                    addInfo: '',
                    custRequests: '',
                    completed: 0,
                    approved: 1,
                    custom: 0,
                    paid: 0,
                }).then(async (data) => {
                    // ChatRoom.create({
                    //     chatId: genId2,
                    //     participants: userData.id + ',' + listing.userId,
                    //     bookingId: genId,
                    // })
                    participants = [userData.id, listing.userId]
                    console.log(userData.name)
                    addRoom(participants, genId, (roomId)=> {
                        updateDB('booking', { bookId: genId }, { chatId: roomId }, () => {
                            console.log('updated successfully')
                            // c-c-callback hell,,?
                            timelineMsg = userData.name + ' placed an order for this tour.'
                            addMessage(roomId, 'SYSTEM', timelineMsg, 'ACTIVITY', () => {
                                //  will be removed once TG accept/reject system is in place
                                addMessage(roomId, 'SYSTEM', 'Tour Guide accepted the order.', 'ACTIVITY', () => {
                                    //  will be removed once payment system is in place
                                    timelineMsg = userData.name + ' made payment. You are now ready to go on your tour!'
                                    addMessage(roomId, 'SYSTEM', timelineMsg, 'ACTIVITY', () => {
                                        res.redirect(`/bookings`)
                                    })
                                })
                            })
                        })
                    })
                }).catch((err) => {
                    console.log(err)
                })
            }
        }).catch((err) => console.log)
})

// Customised booking
router.post('/:id/purchase/customise', async (req, res) => {
    console.log(req.fields)
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })
    const tourID = req.params.id
    const sid = req.signedCookies.sid

    const userData = await genkan.getUserBySessionAsync(sid)
    Shop.findAll({
        where: {
            id: tourID,
        },
    })
        .then(async (items) => {
            const listing = await items[0]['dataValues']

            const v = new Validator(req.fields)

            // Doing this way so its cleaner. Can also directly call these into the removeNull() array
            const reqTextResult = v
                .Initialize({
                    name: 'reqText',
                    errorMessage: 'Please fill in the requirements for your customised tour.',
                })
                .exists()
                .getResult()

            const tourDateResult = v
                .Initialize({
                    name: 'tourDate',
                    errorMessage: 'Please select a tour date.',
                })
                .exists()
                .getResult()

            const bookPaxResult = v
                .Initialize({
                    name: 'tourPax',
                    errorMessage: 'Please select number of participants.',
                })
                .exists()
                .getResult()

            const bookTOCResult = v
                .Initialize({
                    name: 'bookTOC',
                    errorMessage: 'Please agree to the Terms & Conditions before booking a tour.',
                })
                .exists()
                .getResult()

            // // Evaluate the files and fields data separately
            const validationErrors = removeNull([
                reqTextResult,
                tourDateResult,
                bookPaxResult,
                bookTOCResult,
            ])

            // If there are errors, re-render the create listing page with the valid error messages
            if (!emptyArray(validationErrors)) {
                res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
                res.redirect(`/listing/${tourID}/purchase`)
            } else {
                // If successful
                // Remove cookies for stored form values + validation errors
                res.clearCookie('validationErrors')
                res.clearCookie('storedValues')
                const genId = uuid.v4()

                const rawTourDate = req.fields.tourDate
                const darr = rawTourDate.split('/')
                const startTour = new Date(parseInt(darr[2]), parseInt(darr[1])-1, parseInt(darr[0])).toISOString()
                const endTour = new Date(parseInt(darr[2]), parseInt(darr[1])-1, parseInt(darr[0])).toISOString()
                const orderDateTime = new Date().toISOString()
                const customPrice = (listing['tourPrice'] / 10).toFixed(2)

                Booking.create({
                    bookId: genId,
                    custId: userData.id,
                    tgId: listing.userId,
                    listingId: listing.id,
                    chatId: '00000000-0000-0000-0000-000000000000',
                    orderDatetime: orderDateTime,
                    tourStart: startTour,
                    tourEnd: endTour,
                    bookPax: req.fields.tourPax,
                    bookDuration: 0,
                    bookItinerary: listing.finalItinerary,
                    bookBaseprice: listing.tourPrice,
                    bookCharges: customPrice,
                    // processStep: 0, set to 1 for now until approval & payment system is in place
                    processStep: 1,
                    revisions: listing.tourRevision,
                    addInfo: '',
                    custRequests: req.fields.reqText,
                    completed: 0,
                    approved: 1,
                    custom: 1,
                    paid: 0,
                }).then(async (data) => {
                    participants = [userData.id, listing.userId]
                    addRoom(participants, genId, (roomId)=> {
                        updateDB('booking', { bookId: genId }, { chatId: roomId }, () => {
                            console.log('updated successfully')
                            // c-c-callback hell,,?
                            timelineMsg = userData.name + ' placed an order for this tour with custom requirements.'
                            addMessage(roomId, 'SYSTEM', timelineMsg, 'ACTIVITY', () => {
                                //  will be removed once TG accept/reject system is in place
                                addMessage(roomId, 'SYSTEM', 'Tour Guide accepted the order.', 'ACTIVITY', () => {
                                    //  will be removed once payment system is in place
                                    timelineMsg = userData.name + ' paid the customisation fee.'
                                    addMessage(roomId, 'SYSTEM', timelineMsg, 'ACTIVITY', () => {
                                        res.redirect(`/bookings`)
                                    })
                                })
                            })
                        })
                    })
                }).catch((err) => {
                    console.log(err)
                })
            }
        }).catch((err) => console.log)
})

// End: Booking-related items under the listing route

module.exports = router
