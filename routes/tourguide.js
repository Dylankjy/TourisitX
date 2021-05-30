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
const { generateFakeEntry } = require('../app/listingGenerator').generateFakeEntry
const formidableValidator = require('../app/validation')
const { convert } = require('image-file-resize')

// Globals
const router = express.Router()
const { Shop } = require('../models')
const elasticSearchHelper = require('../app/elasticSearch')


const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator


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
    imageToB64Promise(filePath, fileType).then((data) => {
        // Do all your database stuff here also
        // fs.writeFile(toPath, data, err=>{if (err) throw err})
    }).catch((err) => {
        console.log(err)
    })
}


resizeImage = (file, width, height, type) => {
    return new Promise((resolve, reject) =>{
        convert({
            file: file,
            width: width,
            height: height,
            type: type,
        })
            .then((data)=>{
                resolve(data)
            })
            .catch((err)=>{
                reject(err)
            })
    })
}


// To save image to specified folder. A UUID will be given as name
// filePath -- received path; fileName - name of local file; folder - folder to save image to
storeImage = (filePath, fileName, folder) =>{
    const imgName = uuid.v4()

    const fileExt = path.extname(fileName)
    const savedName = `${imgName}${fileExt}`
    const savedPath = `${folder}/${imgName}${fileExt}`

    const data = fs.readFileSync(filePath)
    const imgBuffer = Buffer.from(data)

    fs.writeFileSync(savedPath, imgBuffer)

    return savedName
}


removeNull = (arr) => {
    return arr.filter((n) => n)
}

emptyArray = (arr) => {
    return arr.filter((n) => n).length == 0
}


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


router.get('/manage/listings', (req, res) => {
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
        .then((items)=>{
            const itemsArr = items.map((x)=>x['dataValues']).reverse()
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
        .catch((err)=>{
            console.log
        })
})


router.get('/manage/listings/archived', (req, res) => {
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
        .then((items)=>{
            const itemsArr = items.map((x)=>x['dataValues']).reverse()
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
        .catch((err)=>{
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
