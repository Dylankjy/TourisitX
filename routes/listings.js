const { urlencoded } = require('body-parser')
const express = require('express')
const formidable = require('express-formidable')
const bodyParser = require('body-parser')
const { route } = require('./admin')
const ExpressFormidable = require('express-formidable')
const fs = require('fs')
const exphbs = require('express-handlebars')
const expressSession = require('express-session')
const cors = require('cors')
const { default: axios } = require('axios')
const uuid = require('uuid')
const fileType = require('file-type')
const path = require('path')
const elasticSearch = require('elasticsearch')



// Globals
const router = express.Router()
const {Shop} = require('../models')


// bin\elasticsearch.bat

// router.use(formidable())

class Validator {
    constructor(data) {
        this.data = data
    }

    // Used to initialize the validation. Specify the input name, error message to display if false and the name of element to render when showing error
    Initialize(options) {
        // Reset the result attribute to true (Make result an instance attribute, not a class attribute so I remove it from the constructor)
        this.result = true
        this.name = options.name
        this.errMsg = options.errorMessage
        return this
    }

    // Checks if the element is empty
    exists() {
        if (!this.data[this.name]) {
            this.result = false
            return this
        }
        return this
    }

    // Checks if a string's length falls within the specified range
    isLength(options) {
        const min = options.min
        const max = options.max
        if ((this.data[this.name].toString().length < min) || (this.data[this.name].length > max)) {
            this.result = false
            return this
        }
        // if ((this.data[name]).toString().length < min) return false
        return this
    }

    // Checks if a numerical value is between a given range
    isValue(options) {
        const min = options.min
        const max = options.max

        // If it is a number then I'll validate
        if (!isNaN(this.data[this.name])) {
            if ((this.data[this.name] < min) || (this.data[this.name] > max)) {
                this.result = false
                return this
            }
        } else {
            throw new Error('Only accept Numeric values')
        }
        return this
    }

    // Returns the JSON result of the validation
    getResult() {
        if (this.result == false) {
            return {result: this.result, msg: this.errMsg }
        }
        return null
    }
}


class FileValidator {
    constructor(data) {
        this.data = data
    }

    Initialize(options) {
        this.result = true
        this.errMsg = options.errorMessage
        return this
    }

    fileExists() {
        if (this.data["resume"]["_writeStream"]["bytesWritten"] == 0) {
            this.result = false
            return this
        }
        return this
    }

    sizeAllowed(options) {
        if (this.data["resume"]["_writeStream"]["bytesWritten"] > options.maxSize) {
            this.result = false
        } 
        return this
    }

    extAllowed(allowedExtensions) {
        let extName = path.extname(this.data["resume"]["name"])
        if (!allowedExtensions.includes(extName)) {
            this.result = false
        }
        return this
    }



    getResult() {
        if (this.result == false) {
            return {result: this.result, msg: this.errMsg }
        }
        return null
    }

}



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
getImage = (req, callback) => {
    const filePath = req.files['resume']['path']
    const fileType = req.files['resume']['type']
    imageToB64Promise(filePath, fileType).then((data) => {
        // Do all your database stuff here also
        callback(data)
        // fs.writeFile(toPath, data, err=>{if (err) throw err})
    }).catch((err) => {
        console.log(err)
    })
}


// To save image to specified folder. A UUID will be given as name
// filePath -- received path; ext - extension of file; folder - folder to save image to
storeImage = (filePath, fileExt, folder) =>{
    var imgName = uuid.v4()
    fs.readFile(filePath, (err, data) => {
        var imgBuffer = Buffer.from(data)
        fileExt = fileExt.replace('.', '')
        fs.writeFile(`${folder}/${imgName}.${fileExt}`, imgBuffer, (err) => {console.log(err)})
    })
    return `${imgName}.${fileExt}`
}


// dbImg is the name of the saved image (In the database)
// localImg is the req.files["resume"] object of the image that was submitted
// Returns boolean whether 2 images are the same
sameImage = (dbImg, localImgObject) => {
    return new Promise((res, rej)=>{
        imageToB64Promise(`savedImages/${filename}`, path.extname(filename))
        .then((dbImgDataB64)=>{
            fs.readFile(localImg["path"], (err, localImgData)=>{
                var localImgDataB64 = Buffer.from(localImgData).toString('base64')
                localImgDataB64 = `data:${type};base64, ${base64}`
                if (localImgDataB64 == dbImgDataB64) {
                    console.log("THe 2 images are the same")
                    return true
                } else {
                    console.log("The 2 images are different")
                    return false
                }
            })
        })
        .catch((err)=>{
            console.log(err)
        })
    })
}



removeNull = (arr) => {
    return arr.filter((n) => n)
}

emptyArray = (arr) => {
    return arr.filter((n) => n).length == 0
}

// Put all your routings below this line -----




// can we use shards? (Like how we did product card that time, pass in a json and will fill in the HTML template)
// To create the listing
router.get('/create', (req, res) => {
    // res.render('create_listing.hbs', {validationErr: []})
    // If you have to re-render the page due to errors, there will be cookie storedValue and you use this
    // To use cookie as JSON in javascipt, must URIdecode() then JSON.parse() it
    if (req.cookies.storedValues) {
        console.log("There are SAVED values")
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }

    res.render('tourGuide/createListing.hbs', { validationErrors: req.cookies.validationErrors })
})


// To create the listing
router.post('/create', (req, res)=>{
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    let nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Tour Title must be min 5 characters long'}).exists().isLength({ min: 5 })
        .getResult()

    let descResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Please enter a Tour description'}).exists()
        .getResult()

    let durationResult = v.Initialize({ name: 'tourDuration', errorMessage: 'Please enter a Tour Duration'}).exists()
        .getResult()

    let timingResult = v.Initialize({ name: 'finalTimings', errorMessage: 'Please provide a Tour Timing'}).exists()
        .getResult()

    let dayResult = v.Initialize({ name: 'finalDays', errorMessage: 'Please provide a Tour Day'}).exists()
        .getResult()

    let itineraryResult = v.Initialize({ name: 'finalItinerary', errorMessage: 'Please create a Tour Itinerary'}).exists()
        .getResult()

    let locationResult = v.Initialize({ name: 'finalLocations', errorMessage: 'Please provide at least one location'}).exists()
    .getResult()

    let priceResult = v.Initialize({ name: 'tourPrice', errorMessage: 'Tour price must be more than $0'}).exists().isValue({min:1})
    .getResult()

    let paxResult = v.Initialize({ name: 'tourPax', errorMessage: 'Tour Pax must be at least 1'}).exists().isValue({min:1})
    .getResult()

    let revResult = v.Initialize({ name: 'tourRevision', errorMessage: 'Tour Revision cannot be negative'}).exists().isValue({min:0})
    .getResult()

    // Initialize Image Validator using req.files
    // const imgV = new FileValidator(req.files)
    // let imgResult = imgV.Initialize({ errorMessage: 'Please provide a Tour Image (.png/.jpg allowed < 3MB)'}).fileExists().sizeAllowed({maxSize: 300000}).extAllowed(['.jpg', '.png'])
    // .getResult()

    // Evaluate the files and fields data separately
    var validationErrors = removeNull([nameResult, descResult, durationResult, timingResult, dayResult, itineraryResult, priceResult, paxResult, revResult])

    // If there are errors, re-render the create listing page with the valid error messages
    if (!emptyArray(validationErrors)) {
        console.log("UNCESSESSFUL")
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        res.redirect(`/listing/create`)
        
    } else { // If successful
        // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        Shop.create({
            // You create the uuid when you initialize the create listing
            id: uuid.v4(),
            // Replace with actual usesrID once the auth library is out
            userId: "sample",
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
            tourImage: "default.jpg"
        }).catch((err)=>{
            console.log(err)
        })

        res.send('Success')
    }
})




router.get('/edit/:savedId', (req, res)=>{
    console.log("GET THE EDIT PAGE")
    Shop.findAll({where:{
        id: req.params.savedId
    }}).then((items)=>{
        var savedData = items[0]["dataValues"]
        console.log(savedData)
        // Validate that the user can edit the listing
        // if (userID == savedData["userId"])
        res.cookie('storedValues', JSON.stringify(savedData), {maxAge: 5000})
        res.render('tourGuide/editListing.hbs', { validationErrors: req.cookies.validationErrors })
    }).catch((err)=>{
        console.log(err)
        res.send("No such listing exists!")
    })
})

// To edit the listing
router.post('/edit/:savedId', (req, res)=>{
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    let nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Tour Title must be min 5 characters long'}).exists().isLength({ min: 5 })
        .getResult()

    let descResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Please enter a Tour description'}).exists()
        .getResult()

    let durationResult = v.Initialize({ name: 'tourDuration', errorMessage: 'Please enter a Tour Duration'}).exists()
        .getResult()

    let timingResult = v.Initialize({ name: 'finalTimings', errorMessage: 'Please provide a Tour Timing'}).exists()
        .getResult()

    let dayResult = v.Initialize({ name: 'finalDays', errorMessage: 'Please provide a Tour Day'}).exists()
        .getResult()

    let itineraryResult = v.Initialize({ name: 'finalItinerary', errorMessage: 'Please create a Tour Itinerary'}).exists()
        .getResult()

    let locationResult = v.Initialize({ name: 'finalLocations', errorMessage: 'Please provide at least one location'}).exists()
    .getResult()

    let priceResult = v.Initialize({ name: 'tourPrice', errorMessage: 'Tour price must be more than $0'}).exists().isValue({min:1})
    .getResult()

    let paxResult = v.Initialize({ name: 'tourPax', errorMessage: 'Tour Pax must be at least 1'}).exists().isValue({min:1})
    .getResult()

    let revResult = v.Initialize({ name: 'tourRevision', errorMessage: 'Tour Revision cannot be negative'}).exists().isValue({min:0})
    .getResult()

    // Initialize Image Validator using req.files
    // const imgV = new FileValidator(req.files)
    // let imgResult = imgV.Initialize({ errorMessage: 'Please provide a Tour Image (.png/.jpg allowed < 3MB)'}).fileExists().sizeAllowed({maxSize: 300000}).extAllowed(['.jpg', '.png'])
    // .getResult()

    // Evaluate the files and fields data separately
    var validationErrors = removeNull([nameResult, descResult, durationResult, timingResult, dayResult, itineraryResult, priceResult, paxResult, revResult])

    // If there are errors, re-render the create listing page with the valid error messages
    if (!emptyArray(validationErrors)) {
        console.log("UNCESSESSFUL")
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        console.log("REDIRECT FOR EDIT POST")
        res.redirect(`/listing/edit/${req.params.savedId}`)
        
    } else { // If successful
        // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        console.log("GONING TO SAVE EDITTED LISTING")
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
            tourImage: "default.jpg"
        }, {
            where: { id: req.params.savedId }
        }).catch((err)=>{
            console.log(err)
        })

        res.send('Success')
    }
})


// Show the user all of their own listings
router.get('/', (req, res)=>{
    Shop.findAll({where:{
        // Set to empty now, but it should be replaced with the userID when authentication library is out
        userId: "sample"
    }}).then((items)=>{
        var itemsArr = items.map(x=>x["dataValues"])
        console.log(itemsArr)
        res.render('tourGuide/myListings.hbs' , {datas: itemsArr})
    }).catch(err=>console.log)
})



// To get a specific listing
router.get('/:id', (req, res)=>{
    var itemID = req.params.id

    Shop.findAll({where:{
        id: itemID
    }}).then((items)=>{
        var data = items[0]["dataValues"]
        console.log(data["finalItinerary"])
        res.render('listing.hbs', {data: data})
    }).catch(err=>console.log)
}) 



// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

router.get('/api/getImage/:id', (req, res)=>{
    var itemID = req.params.id

    Shop.findAll({where:{
        id: itemID
    }}).then((items)=>{
        res.json(items[0]["tourImage"])
    }).catch(err=>console.log)
})



// Elastic Search stuff

const esClient = elasticSearch.Client({
    host: "http://localhost:9200"
})


router.post('/upload', (req, res) => {
    esClient.index({
        index: 'products',
        body: {
            "id": req.fields.id,
            "name": req.fields.name,
            "description": req.fields.description,
            "image": req.fields.image
        }
    })
    .then((data)=>{
        console.log("Indexed!")
        return res.json({"Message": "Indexing successful"})
    })
    .catch(err=>{
        console.log(err)
    })
})


router.get('/search', (req, res) => {
    const searchText = req.query.text
    esClient.search({
        index: "products",
        body: {
            query: {
                fuzzy: {
                    name : {
                        value: searchText.trim(),
                        fuzziness: 5
                    }
                }
            }
        }
    })
    .then((data)=>{
        console.log("Ran")
        return res.json(data)
    })
    .catch((err)=>{
        return res.status(500).json({"Message": "Error"})
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
