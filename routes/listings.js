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
router.use(formidable())

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
var x = {"tourTitle":"sdfsd","tourDesc":"fdfd","tourDuration":"","tourTimings":"-","tourDays":"-","finalTimings":"","finalDays":""}


// const v_name = new Validator(x)
// const v_age = new Validator(x)
const v = new Validator(x)


nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Needs to be 5 chars!', renderedName: "Tour Title" }).exists().isLength({ min: 7 })
    .getResult()

ageResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Tour Age doesnt exist', renderedName: "Tour Age" }).exists()
    .getResult()


var allResults = [nameResult, ageResult]

// console.log(allResults)
// console.log(allResults.filter(n => n).length)


// Will convert Image to base64.

// Callback implementation
// imageToB64(filePath, fileType, (data)=>{
//     fs.writeFile(toPath, data, err=>{if (err) throw err})
// })
function imageToB64Callback(filePath, fileType, callback) {
    fs.readFile(filePath, (err, data)=>{
        var base64 = Buffer.from(data).toString('base64');
        // var formattedSrc = `<img src="data:${fileType};base64, ${base64}">`
        var formattedSrc = `data:${fileType};base64, ${base64}`
        
        callback(formattedSrc)
        // console.log(base64)
    })
}

// Promise implementation
// imageToB64(filePath, fileType).then(data=>console.log(data))
function imageToB64Promise(filePath, fileType) {
    return new Promise((res, rej)=>{
        fs.readFile(filePath, (err, data)=>{
            if (err) {
                rej(err)
            } 
            var base64 = Buffer.from(data).toString('base64');
            // var formattedSrc = `<img src="data:${fileType};base64, ${base64}">`
            var formattedSrc = `data:${fileType};base64, ${base64}`
            res(formattedSrc)
        })
    })

}

function getImage(req, callback) {
    var filePath = req.files["resume"]["path"]
    var fileType = req.files["resume"]["type"]
    imageToB64Promise(filePath, fileType).then((data)=>{
        // Do all your database stuff here also
        callback(data)
        // fs.writeFile(toPath, data, err=>{if (err) throw err})
    }).catch((err)=>{
        console.log(err)
    })
}

function removeNull(arr) {
    return arr.filter(n => n)
}

function emptyArray(arr) {
    return arr.filter(n => n).length == 0
}


// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }


router.get('/create', (req, res)=>{
    // res.render('create_listing.hbs', {validationErr: []})
    res.render('create_listing.hbs', {validationErrors: []})
})


router.post('/submit-create', (req, res)=>{
        console.log(req.fields)

        const v = new Validator(req.fields)

        nameResult = v.Initialize({ name: 'tourTitle', errorMessage: 'Please enter a Tour Title!', renderedName: "Tour Title" }).exists().isLength({ min: 5 })
            .getResult()

        ageResult = v.Initialize({ name: 'tourDesc', errorMessage: 'Please enter a Tour description', renderedName: "Tour Description" }).exists()
            .getResult()

        var allvalidations = removeNull([nameResult, ageResult])

        // If there are errors, re-render the create listing page with the valid error messages
        if (!emptyArray(allvalidations)) {
            console.log(allvalidations)
            errors = allvalidations
            res.render('create_listing.hbs', {validationErrors: allvalidations})
        } else {
            res.send("Success")
        }
        

        
        // TO extract the image from files
        // getImage(req, (base64)=>{
        //     //DO database stuff here
        // })
    }
)

// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

module.exports = router
