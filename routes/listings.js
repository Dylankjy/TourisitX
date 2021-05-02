const { urlencoded } = require('body-parser')
const express = require('express')
const formidable = require('formidable')
const bodyParser = require('body-parser')
const { route } = require('./admin')
const { validate, ValidationError, Joi } = require('express-validation')

const listingValidation = {
    body: Joi.object({
        theName: Joi.string().required().min(3),
        theDesc: Joi.string().required(),
    }),
}

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


// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/create', (req, res)=>{
    res.render('create_listing.hbs')
})

router.post('/submit-create', (req, res)=>{
    var createListingForm = new formidable.In
    res.json(req.files)
}
)

module.exports = router
