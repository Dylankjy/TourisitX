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



// Globals
const router = express.Router()
const {Shop} = require('../models')

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
            console.log("This ran")
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
        console.log("Ext" + extName)
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
        const formattedSrc = `data:${fileType};base64, ${base64}`

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
            const formattedSrc = `data:${fileType};base64, ${base64}`
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
        fs.writeFile(`public/${imgName}.${fileExt}`, imgBuffer, (err) => {console.log(err)})
    })
    return `${imgName}.${fileExt}`
}



removeNull = (arr) => {
    return arr.filter((n) => n)
}

emptyArray = (arr) => {
    return arr.filter((n) => n).length == 0
}

// Put all your routings below this line -----


// can we use shards? (Like how we did product card that time, pass in a json and will fill in the HTML template)
router.get('/create', cors(), (req, res) => {
    // res.render('create_listing.hbs', {validationErr: []})
    // If you have to re-render the page due to errors, there will be cookie storedValue and you use this
    // To use cookie as JSON in javascipt, must URIdecode() then JSON.parse() it
    if (req.cookies.storedValues) {
        const storedValues = JSON.parse(req.cookies.storedValues)
    } else {
        const storedValues = {}
    }

    // console.log(`Stored values is: ${storedValues}`)
    // console.log(`Stored type is: ${typeof(storedValues)}`)
    // console.log(`Stored title is: ${storedValues["tourTitle"]}`)

    res.render('tourGuide/createListing.hbs', { validationErrors: req.cookies.validationErrors })
})

router.post('/create', (req, res)=>{
    // Save the form values so we can re-render them if there are errors
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
    const imgV = new FileValidator(req.files)
    let imgResult = imgV.Initialize({ errorMessage: 'Please provide a Tour Image (.png/.jpg allowed < 3MB)'}).fileExists().sizeAllowed({maxSize: 300000}).extAllowed(['.jpg', '.png'])
    .getResult()

    var validationErrors = removeNull([nameResult, descResult, durationResult, timingResult, dayResult, itineraryResult, priceResult, paxResult, revResult, imgResult])

    // If there are errors, re-render the create listing page with the valid error messages
    // if (!emptyArray(validationErrors)) {
    if (false) {
        res.cookie('validationErrors', validationErrors, { maxAge: 5000 })
        // If a valid image was provided, we want to persist it
        console.log(imgResult)
        if (imgResult == null) {
            console.log("Saving image COOKIE")
            // If there was a previous savedImageName cookie saved (Meaning that a valid image was submitted before)
            // I'll check if the submitted names are the same
            console.log(req.cookies.savedImageName)
            // console.log(req.files["resume"]["name"])
            if (req.cookies.savedImageName  == req.files["resume"]["name"]) {
                console.log("YES RAN")
                
            }
            // Save the image to the tmp directory. If the next image name is the same as the previous one, we'll use this image
            // Else if the name is different, means a new image was uploaded. Then we'll delete this saved image and use the newly uploaded image
            

            res.cookie('savedImageName', req.files["resume"]["name"])
            res.redirect('/listing/create')
        } else {
            res.redirect('/listing/create')
        }
        
    } else { // If successful
        // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')

        console.log(`Result is ${JSON.stringify(imgResult)}`)
        var filePath = req.files['resume']['path']
        var fileExt = path.extname(req.files['resume']['name'])

        var savedPath = storeImage(filePath, fileExt, 'savedImages')

        Shop.create({
            id: uuid.v4(),
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
            tourImage: savedPath
        }).catch((err)=>{
            console.log(err)
        })

        res.send('Success')
    }


    // TO extract the image from files
    // getImage(req, (base64)=>{
    //     //DO database stuff here
    // })
})


// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

module.exports = router
