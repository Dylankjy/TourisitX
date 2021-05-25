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
const { nodeFetch } = require('node-fetch')


// Globals
const router = express.Router()
const { Shop } = require('../models')
const elasticSearchHelper = require('../app/elasticSearch')
// const esClient = elasticSearch.Client({
//     host: 'http://47.241.14.108:9200',
// })

var TIH_API_KEY = "GgjNvD9p8MA6c3emVYknlImLc5cAdj7X"

const esClient = require('../app/elasticSearch').esClient

const Validator = formidableValidator.Validator
const fileValidator = formidableValidator.FileValidator
// bin\elasticsearch.bat

// router.use(formidable())


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

// Show the user all of their own listings
router.get('/', (req, res)=>{
    // Shop.findAll(
    //     {
    //         where: {
    //             // Set to empty now, but it should be replaced with the userID when authentication library is out
    //             userId: 'sample',
    //         },
    //         order:
    //             [['createdAt', 'ASC']],
    //     },
    // )
    //     .then((items)=>{
    //         const itemsArr = items.map((x)=>x['dataValues']).reverse()
    //         res.render('tourGuide/myListings.hbs', { datas: itemsArr })
    //     })
    //     .catch((err)=>{
    //         console.log
    //     })
    res.redirect('/tourguide/manage/listings')
})


// To get a specific listing
router.get('/info/:id', (req, res)=>{
    const itemID = req.params.id

    // if (req.cookies.imageValError) {
    const errMsg = req.cookies.imageValError || ''
    // } else {
    //     const errMsg = ''
    // }

    Shop.findAll({ where: {
        id: itemID,
    } }).then(async (items)=>{
        const data = await items[0]['dataValues']
        // Check here if data.userId = loggedIn user ID
        if (true) {
            // Manually set to true now.. while waiting for the validation library
            owner = true
        } else {
            owner = false
        }
        res.render('listing.hbs', { data: data, isOwner: owner, errMsg: errMsg })
    }).catch((err)=>console.log)
})


// can we use shards? (Like how we did product card that time, pass in a json and will fill in the HTML template)
// To create the listing
router.get('/create', (req, res) => {
    // res.render('create_listing.hbs', {validationErr: []})
    // If you have to re-render the page due to errors, there will be cookie storedValue and you use this
    // To use cookie as JSON in javascipt, must URIdecode() then JSON.parse() it
    if (req.cookies.storedValues) {
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }

    res.render('tourGuide/createListing.hbs', { validationErrors: req.cookies.validationErrors, layout: 'tourGuide' })
})


// To create the listing
router.post('/create', (req, res)=>{
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    const nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Tour Title must be min 5 characters long' }).exists().isLength({ min: 5 })
        .getResult()

    const descResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Please enter a Tour description' }).exists()
        .getResult()

    const durationResult = v.Initialize({ name: 'tourDuration', errorMessage: 'Please enter a Tour Duration' }).exists()
        .getResult()

    const timingResult = v.Initialize({ name: 'finalTimings', errorMessage: 'Please provide a Tour Timing' }).exists()
        .getResult()

    const dayResult = v.Initialize({ name: 'finalDays', errorMessage: 'Please provide a Tour Day' }).exists()
        .getResult()

    const itineraryResult = v.Initialize({ name: 'finalItinerary', errorMessage: 'Please create a Tour Itinerary' }).exists()
        .getResult()

    const locationResult = v.Initialize({ name: 'finalLocations', errorMessage: 'Please provide at least one location' }).exists()
        .getResult()

    const priceResult = v.Initialize({ name: 'tourPrice', errorMessage: 'Tour price must be more than $0' }).exists().isValue({ min: 1 })
        .getResult()

    const paxResult = v.Initialize({ name: 'tourPax', errorMessage: 'Tour Pax must be at least 1' }).exists().isValue({ min: 1 })
        .getResult()

    const revResult = v.Initialize({ name: 'tourRevision', errorMessage: 'Tour Revision cannot be negative' }).exists().isValue({ min: 0 })
        .getResult()

    // Initialize Image Validator using req.files
    // const imgV = new FileValidator(req.files)
    // let imgResult = imgV.Initialize({ errorMessage: 'Please provide a Tour Image (.png/.jpg allowed < 3MB)'}).fileExists().sizeAllowed({maxSize: 300000}).extAllowed(['.jpg', '.png'])
    // .getResult()

    // Evaluate the files and fields data separately
    const validationErrors = removeNull([nameResult, descResult, durationResult, timingResult, dayResult, itineraryResult, locationResult, priceResult, paxResult, revResult])

    // If there are errors, re-render the create listing page with the valid error messages
    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/listing/create`)
    } else { // If successful
        // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        const genId = uuid.v4()

        Shop.create({
            // You create the uuid when you initialize the create listing
            id: genId,
            // Replace with actual usesrID once the auth library is out
            userId: 'sample',
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
            tourImage: 'default.jpg',
            hidden: 'false',
        })
            .then(async (data)=>{
                await axios.post('http://localhost:5000/listing/es-api/upload', {
                    'id': genId,
                    'name': req.fields.tourTitle,
                    'description': req.fields.tourDesc,
                    'image': req.fields.tourImage,
                })

                console.log('Inserted')
                res.redirect(`/listing`)
            })
            .catch((err)=>{
                console.log(err)
            })
    }
})


router.get('/edit/:savedId', (req, res)=>{
    Shop.findAll({ where: {
        id: req.params.savedId,
    } }).then((items)=>{
        const savedData = items[0]['dataValues']
        // Validate that the user can edit the listing
        // if (userID == savedData["userId"])
        res.cookie('storedValues', JSON.stringify(savedData), { maxAge: 5000 })
        res.render('tourGuide/editListing.hbs', { validationErrors: req.cookies.validationErrors })
    }).catch((err)=>{
        console.log(err)
        res.send('No such listing exists!')
    })
})

// To edit the listing
router.post('/edit/:savedId', (req, res)=>{
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    const nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Tour Title must be min 5 characters long' }).exists().isLength({ min: 5 })
        .getResult()

    const descResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Please enter a Tour description' }).exists()
        .getResult()

    const durationResult = v.Initialize({ name: 'tourDuration', errorMessage: 'Please enter a Tour Duration' }).exists()
        .getResult()

    const timingResult = v.Initialize({ name: 'finalTimings', errorMessage: 'Please provide a Tour Timing' }).exists()
        .getResult()

    const dayResult = v.Initialize({ name: 'finalDays', errorMessage: 'Please provide a Tour Day' }).exists()
        .getResult()

    const itineraryResult = v.Initialize({ name: 'finalItinerary', errorMessage: 'Please create a Tour Itinerary' }).exists()
        .getResult()

    const locationResult = v.Initialize({ name: 'finalLocations', errorMessage: 'Please provide at least one location' }).exists()
        .getResult()

    const priceResult = v.Initialize({ name: 'tourPrice', errorMessage: 'Tour price must be more than $0' }).exists().isValue({ min: 1 })
        .getResult()

    const paxResult = v.Initialize({ name: 'tourPax', errorMessage: 'Tour Pax must be at least 1' }).exists().isValue({ min: 1 })
        .getResult()

    const revResult = v.Initialize({ name: 'tourRevision', errorMessage: 'Tour Revision cannot be negative' }).exists().isValue({ min: 0 })
        .getResult()

    const validationErrors = removeNull([nameResult, descResult, durationResult, timingResult, dayResult, itineraryResult, locationResult, priceResult, paxResult, revResult])

    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/listing/edit/${req.params.savedId}`)
    } else {
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        Shop.update({
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
        }, {
            where: { id: req.params.savedId },
        })
            .then(async (data)=>{
                const doc = {
                    'id': req.params.savedId,
                    'name': req.fields.tourTitle,
                    'description': req.fields.tourDesc,
                }
                console.log(doc['id'])

                await elasticSearchHelper.updateDoc(doc)

                res.redirect(`/listing/info/${req.params.savedId}`)
            })
            .catch((err)=>{
                console.log(err)
            })
    }
})

router.get('/api/autocomplete/location', (req, res) => {
    axios.get(`https://tih-api.stb.gov.sg/map/v1/autocomplete/type/address?input=${req.query.typedLocation}&apikey=${TIH_API_KEY}`)
    .then((data) => {
        return res.json(data["data"])
    }).catch((err)=>{
        console.log(err)
    })
})


router.post('/edit/image/:savedId', (req, res)=>{
    console.log('Image edited')
    const v = new fileValidator(req.files['tourImage'])
    const imageResult = v.Initialize({ errorMessage: 'Please supply a valid Image' }).fileExists().sizeAllowed({ maxSize: 5000000 })
        .getResult()

    // Upload is successful
    if (imageResult == null) {
        let filePath = req.files['tourImage']['path']
        let fileName = req.files['tourImage']['name']
        const saveFolder = 'savedImages/Listing'
        const savedName = storeImage(filePath = filePath, fileName = fileName, folder=saveFolder)
        console.log(`Added file is ${savedName}`)

        Shop.findAll({ where: {
            id: req.params.savedId,
        } })
            .then((items)=>{
                const savedImageFile = items[0]['dataValues']['tourImage']
                if (savedImageFile != 'default.jpg') {
                    console.log(`Removed IMAGE FILE: ${savedImageFile}`)
                    fs.unlinkSync(`savedImages/Listing/${savedImageFile}`)
                }
            })

        Shop.update({
            tourImage: savedName,
        }, {
            where: { id: req.params.savedId },
        }).catch((err)=>{
            console.log(err)
        })
            .then(async (data)=>{
                // Update elastic search
                const doc = {
                    'id': req.params.savedId,
                    'image': savedName,
                }

                await elasticSearchHelper.updateImage(doc)

                res.redirect(`/listing/info/${req.params.savedId}`)
            })
            .catch((err)=> {
                console.log(err)
            })
    } else {
        const errMsg = imageResult.msg
        console.log('Failed')
        res.cookie('imageValError', errMsg, { maxAge: 5000 })
        res.redirect(`/listing/info/${req.params.savedId}`)
    }
})


router.get('/delete/:savedId', (req, res)=>{
    // rmb to delete the images too
    Shop.findAll({ where: {
        id: req.params.savedId,
    } })
        .then((items)=>{
        // Only delete image from local folder if it is NOT the default image
            const savedImageFile = items[0]['dataValues']['tourImage']
            if (savedImageFile != 'default.jpg') {
                console.log(`Delete listing and Removed IMAGE FILE: ${savedImageFile}`)
                fs.unlinkSync(`savedImages/Listing/${savedImageFile}`)
            }
        })

    Shop.destroy({
        where: {
            id: req.params.savedId,
        },
    }).then((data)=>{
        // Delete from elastic search client
        deleteDoc('products', req.params.savedId)
        res.send('Deleted!')
    }).catch((err)=>{
        console.log(err)
    })
})


// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

router.get('/api/getImage/:id', (req, res)=>{
    const itemID = req.params.id

    Shop.findAll({ where: {
        id: itemID,
    } }).then((items)=>{
        res.json(items[0]['tourImage'])
    }).catch((err)=>console.log)
})


// Elastic Search stuff

// const esClient = elasticSearch.Client({
//     host: 'http://localhost:9200',
// })


router.get('/es-api/create-index', (req, res)=>{
    const searchText = req.query.text
    esClient.indices.create({
        index: 'products',
        id: req.fields.id,
        body: {
            'settings': {
                // SPECIFY ALL THE CUSTOM FILTERS AND ANALYZERS HERE
                'analysis': {
                    // Specify custom filters here
                    'filter': {
                        // Will generate n-grams from the words {E.g "shirt --> "sh", "shi", "shir", "shirt"}
                        'autocomplete_filter': {
                            'type': 'ngram',
                            'min_gram': '3',
                            'max_gram': '4',
                        },
                    },
                    // Specify custom analyzers here
                    'analyzer': {
                        'autocomplete': {
                            'filter': ['lowercase', 'autocomplete_filter'],
                            'type': 'custom',
                            'tokenizer': 'whitespace',
                        },
                    },
                },
            },
            // Define the mappings here
            'mappings': {
                // Define the field mapppings here
                'properties': {
                    'name': {
                        'type': 'text',
                        // Define the custom analyzers here (This is run everytime a new data is added)
                        'analyzer': 'autocomplete',
                    },
                    'description': {
                        'type': 'text',
                        'index': 'false',
                    },
                    'image': {
                        'type': 'text',
                        'index': 'false',
                    },
                },
            },
            // 'index':{
            //     "similarity": {
            //         "name_similarity": {
            //             "type": ""
            //         }
            //     }
            // }
        },
    })
        .then((data)=>{
            return res.json({ 'Message': 'Indexing Successful' })
        })
        .catch((err)=>{
            console.log(err)
            return res.status(500).json({ 'Message': 'Error' })
        })
})


router.post('/es-api/upload', (req, res) => {
    esClient.index({
        index: 'products',
        // Need to define the ID here so you can update using ID
        id: req.fields.id,
        body: {
            'name': req.fields.name,
            // "id": req.fields.id,
            'description': req.fields.description,
            'image': req.fields.image,
            // "suggest": {
            //     input: req.fields.name.split(' '),
            // },
            // "output": req.fields.name
        },
    })
        .then((data)=>{
            console.log('Indexed!')
            return res.json({ 'Message': 'Indexing successful' })
        })
        .catch((err)=>{
            console.log(err)
        })
})


router.post('/es-api/update', (req, res) => {
    esClient.update({
        index: 'products',
        id: req.fields.id,
        body: {
            doc: {
                'name': req.fields.name,
                // "id": req.fields.id,
                'description': req.fields.description,
                'image': req.fields.image,
            },
        },
    })
        .then((data)=>{
            console.log('Updated!')
            return res.json({ 'Message': 'Update successful' })
        })
        .catch((err)=>{
            console.log(err)
        })
})


router.get('/es-api/delete', (req, res) => {
    esClient.indices.delete({
        index: 'products',
    })
        .then((data)=>{
            console.log('Deleted!')
            return res.json({ 'Message': 'Delete successful' })
        })
        .catch((err)=>{
            console.log(err)
        })
})


router.get('/es-api/search', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: 'products',
        body: {
            'query': {
                'match': {
                    // Specify the 'name' field to be matched against the searchText
                    'name': searchText,
                },
            },
            'sort': ['_score'],
        },
    })
        .then((data)=>{
            return res.json(data)
        })
        .catch((err)=>{
            console.log(err)
            return res.status(500).json({ 'Message': 'Error' })
        })
})


router.get('/es-api/suggest', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: 'products',
        body: {
            suggest: {
                gotsuggest: {
                    text: searchText,
                    term: { field: 'name' },
                },
            },
        },
    })
        .then((data)=>{
            console.log('Ran suggester')
            return res.json(data)
        })
        .catch((err)=>{
            return res.status(500).json({ 'Message': 'Error' })
        })
})


// To generate fake entries to test out elastic search
router.get('/es-api/dev/generateFakes', (req, res) => {
    const noToGenerate = req.query.num
    const fakes = []
    for (let i = 0; i <= noToGenerate; i ++) {
        fakes.push(generateFakeEntry())
    }

    const body = fakes.flatMap((doc) => [{ index: { _index: 'products' } }, doc])
    esClient.bulk({ refresh: true, body })
        .then((d)=>{
            console.log(d)
            res.json({ 'Message': 'Success' })
        })
        .catch((err)=>{
            console.log(err)
            res.json(err)
        })
})

// docs is the array of documents to batch inset. index is the name of the ElasticSearch index to populate
// batchIndex = (docs, esIndex) => {
//     return new Promise((resolve, reject)=>{
//         const body = docs.flatMap((doc) => [{ index: { _index: esIndex } }, doc])
//         esClient.bulk({ refresh: true, body })
//             .then((d)=>{
//                 resolve(d)
//             })
//             .catch((err)=>{
//                 reject(err)
//             })
//     })
// }

// To populate the elastic search index using the Shop Database
router.get('/es-api/getFromShopDB', async (req, res) => {
    await axios('http://localhost:5000/listing/es-api/delete')
    await axios('http://localhost:5000/listing/es-api/create-index')
    // This array will contain all the JSON objects
    const docs = []
    // Specify the attributes to retrieve
    Shop.findAll({ attributes: ['id', ['tourTitle', 'name'], ['tourDesc', 'description'], ['tourImage', 'image']] })
        .then((data)=>{
            data.forEach((doc)=>{
            // console.log(doc["Shop"]["dataValues"])
                docs.push(doc['dataValues'])
            })

            elasticSearchHelper.batchIndex(docs, 'products')
                .then((data)=>{
                    res.json({ 'Message': 'Success', 'data': docs })
                })
                .catch((err)=>{
                    console.log(err)
                    res.json({ 'Message': 'Failed to populate ElasticSearch from SQL' })
                })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Error Querying from SQL' })
        })
})


// To initialize the elastic search client for the first time
router.get('/es-api/initFromDB', async (req, res) => {
    await axios('http://localhost:5000/listing/es-api/create-index')
    // This array will contain all the JSON objects
    const docs = []
    // Specify the attributes to retrieve
    Shop.findAll({ attributes: ['id', ['tourTitle', 'name'], ['tourDesc', 'description'], ['tourImage', 'image']] })
        .then((data)=>{
            data.forEach((doc)=>{
            // console.log(doc["Shop"]["dataValues"])
                docs.push(doc['dataValues'])
            })

            elasticSearchHelper.batchIndex(docs, 'products')
                .then((data)=>{
                    res.json({ 'Message': 'Success', 'data': docs })
                })
                .catch((err)=>{
                    console.log(err)
                    res.json({ 'Message': 'Failed to populate ElasticSearch from SQL' })
                })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Error Querying from SQL' })
        })
})


// esClient.search({
//     index: "products",
//     body: {
//         query: {
//             fuzzy : {
//                 description: {
//                     value: "sing",
//                     fuzziness: 5
//                 }
//             }
//         },
//     }
// })
// .then((data)=>{
//     console.log(data["hits"]["hits"])
// })
// .catch((err)=>{
//     console.log("Ther eis nothign")
// })


module.exports = router
