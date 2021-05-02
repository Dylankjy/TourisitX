const { urlencoded } = require('body-parser')
const express = require('express')
const formidable = require('express-formidable')
const bodyParser = require('body-parser')
const { route } = require('./admin')
const ExpressFormidable = require('express-formidable')
const fs = require('fs')


// const urlencodedParser = bodyParser.urlencoded({extended: false})


const router = express.Router()
router.use(formidable())

class Validator {
    constructor(data) {
        this.data = data
        this.result = true
    }

    // Used to initialize the validation. Specify the input name and the error message to display if false
    Initialize(options) {
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
            return { name: this.name, result: this.result, msg: this.errMsg }
        }
        return { name: this.name, result: this.result }
    }
}

// x is sample data POST DATA
const x = { 'theName': 'Jake', 'theAge': 4 }


const v = new Validator(x)


nameResult = v.Initialize({ name: 'theName', errorMessage: 'Needs to be 5 chars!' }).exists().isLength({ min: 5 })
    .getResult()

ageResult = v.Initialize({ name: 'theAge', errorMessage: 'Minimum age is 10' }).exists().isValue({ min: 10 })
    .getResult()


const allResults = [nameResult, ageResult]
// console.log(allResults)

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


// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/create', (req, res)=>{
    res.render('create_listing.hbs')
})

router.post('/submit-create', (req, res)=>{
        res.json(req.files)
        
        // TO extract the image from files
        const filePath = req.files["resume"]["path"]
        const fileType = req.files["resume"]["type"]
        console.log(filePath)
        imageToB64Promise(filePath, fileType).then((data)=>{
            // Do all your database stuff here also
            fs.writeFile(toPath, data, err=>{if (err) throw err})
        }).catch((err)=>{
            console.log(err)
        })
    }
)

// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

module.exports = router
