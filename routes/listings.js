const { urlencoded } = require('body-parser')
const express = require('express')
const formidable = require('express-formidable')
const bodyParser = require('body-parser')
const { route } = require('./admin')
const ExpressFormidable = require('express-formidable')
const fs = require('fs')
const exphbs = require('express-handlebars')
const expressSession = require('express-session')


// Globals


const router = express.Router()
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
        this.renderedName = options.renderedName
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
            return { renderedName: this.renderedName, result: this.result, msg: this.errMsg }
        }
        return null
    }
}

// x is sample data POST DATA
// const x = { theName: 'Jake', theAge: 4 }
const x = { 'tourTitle': 'sdfsd', 'tourDesc': 'fdfd', 'tourDuration': '', 'tourTimings': '-', 'tourDays': '-', 'finalTimings': '', 'finalDays': '' }


// const v_name = new Validator(x)
// const v_age = new Validator(x)
const v = new Validator(x)


nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Needs to be 5 chars!', renderedName: 'Tour Title' }).exists().isLength({ min: 7 })
    .getResult()

ageResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Tour Age doesnt exist', renderedName: 'Tour Age' }).exists()
    .getResult()


const allResults = [nameResult, ageResult]

// console.log(allResults)
// console.log(allResults.filter(n => n).length)


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

removeNull = (arr) => {
    return arr.filter((n) => n)
}

emptyArray = (arr) => {
    return arr.filter((n) => n).length == 0
}


// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

// can we use shards? (Like how we did product card that time, pass in a json and will fill in the HTML template)
router.get('/create', (req, res) => {
    // res.render('create_listing.hbs', {validationErr: []})
    // If you have to re=render the page due to errors, there will be cookie storedValue and you use this
    // To use cookie as JSON in javascipt, must URIdecode() then JSON.parse() it
    if (req.signedCookies.storedValues) {
        const storedValues = JSON.parse(req.signedCookies.storedValues)
    } else {
        const storedValues = {}
    }

    // console.log(`Stored values is: ${storedValues}`)
    // console.log(`Stored type is: ${typeof(storedValues)}`)
    // console.log(`Stored title is: ${storedValues["tourTitle"]}`)

    res.render('tourGuide/createListing.hbs', { validationErrors: req.signedCookies.validationErrors })
})

router.post('/create', (req, res)=>{
    // Save the form values so we can re-render them if there are errors
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 360000 })

    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    const nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Please enter a Tour Title!', renderedName: 'Tour Title' }).exists().isLength({ min: 5 })
        .getResult()

    const descResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Please enter a Tour description', renderedName: 'Tour Description' }).exists()
        .getResult()

    const durationResult = v.Initialize({ name: 'tourDuration', errorMessage: 'Please enter a Tour Duration', renderedName: 'Tour Duration' }).exists()
        .getResult()

    const timingResult = v.Initialize({ name: 'finalTimings', errorMessage: 'Please provide a Tour Timing', renderedName: 'Tour Timing' }).exists()
        .getResult()

    const dayResult = v.Initialize({ name: 'finalDays', errorMessage: 'Please provide a Tour Day', renderedName: 'Tour Day' }).exists()
        .getResult()

    const itineraryResult = v.Initialize({ name: 'finalItinerary', errorMessage: 'Please create a Tour Itinerary', renderedName: 'Tour Itinerary' }).exists()
        .getResult()


    const validationErrors = removeNull([nameResult, descResult, durationResult, timingResult, dayResult, itineraryResult])

    // If there are errors, re-render the create listing page with the valid error messages
    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors, { maxAge: 360000 })
        // res.render('create_listing.hbs', {validationErrors: validationErrors})
        res.redirect('/listing/create')
    } else {
        // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        console.log(req.fields)
        res.send('Success')
    }


    // TO extract the image from files
    // getImage(req, (base64)=>{
    //     //DO database stuff here
    // })
},
)

// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

module.exports = router
