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

// Will convert to base64.
// toHTML specifies whether you want to render image directly in a html file. If false (default) then will just write the base64 string
// e.g imageToB64(filePath, fileType, {toHTML: false, toPath: 'routes/final.txt'})
// toPath specifies the file to write the data to 
function imageToB64(filePath, fileType, options) {
    fs.readFile(filePath, (err, data)=>{
        var base64 = Buffer.from(data).toString('base64');
        if (options.toHTML) {
            var formattedSrc = `<img src="data:${fileType};base64, ${base64}">`
        } else {
            var formattedSrc = `data:${fileType};base64, ${base64}`
        }
        if (options.toPath) {
            var toPath = options.toPath
        } else {
            var toPath = 'routes/default.txt'
        }
        fs.writeFile(toPath, formattedSrc, err=>{if (err) throw err})
        // console.log(base64)
    })
}


// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/create', (req, res)=>{
    res.render('create_listing.hbs')
})

router.post('/submit-create', (req, res)=>{
        res.json(req.files)
        const filePath = req.files["resume"]["path"]
        const fileType = req.files["resume"]["type"]

        imageToB64(filePath, fileType, {toPath: 'routes/final.txt'})
        // data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64');
        // fs.readFile(filePath, (err, data)=>{
        //     var base64 = Buffer.from(data).toString('base64');
        //     // Do this if you want to directly see the image in a html file
        //     // var formattedSrc = `<img src="data:${fileType};base64, ${base64}">`
        //     var formattedSrc = `data:${fileType};base64, ${base64}`
        //     fs.writeFile('routes/img.txt', formattedSrc, err=>{if (err) throw err})
        //     // console.log(base64)
        // })
    }
)

// fs.writeFile('this.html', "What is this", (err) =>{
//     if (err) throw err
// })

module.exports = router
