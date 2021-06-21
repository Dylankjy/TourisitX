const express = require('express')
const uuid = require('uuid')


const router = express.Router()
const { Support } = require('../models')

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
            return { result: this.result, msg: this.errMsg }
        }
        return null
    }
}
// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/helpdesk', (req, res) => {
    return res.render('support.hbs')
})

router.post('/helpdesk', (req, res) => {
    res.cookie('storedValues', JSON.stringify(req.fields), { maxAge: 5000 })

    const v = new Validator(req.fields)

    // Doing this way so its cleaner. Can also directly call these into the removeNull() array
    const typeResult = v.Initialize({ name: 'type', errorMessage: 'Please select a choice' }).exists().getResult()

    const contentResult = v.Initialize({ name: 'content', errorMessage: 'Please provide a brief description of problem' }).exists().getResult()

    // Initialize Image Validator using req.files
    // const imgV = new FileValidator(req.files)
    // let imgResult = imgV.Initialize({ errorMessage: 'Please provide a Tour Image (.png/.jpg allowed < 3MB)'}).fileExists().sizeAllowed({maxSize: 300000}).extAllowed(['.jpg', '.png'])
    // .getResult()

    // Evaluate the files and fields data separately
    const validationErrors = removeNull([typeResult, contentResult])

    // If there are errors, re-render the create listing page with the valid error messages
    if (!emptyArray(validationErrors)) {
        res.cookie('validationErrors', validationErrors)
        res.redirect(`/helpdesk`)
    } else { // If successful
        // Remove cookies for stored form values + validation errors
        res.clearCookie('validationErrors')
        res.clearCookie('storedValues')
        res.clearCookie('savedImageName')

        Support.create({
            // You create the uuid when you initialize the create listing
            tid: uuid.v4(),
            // Replace with actual usesrID once the auth library is out
            uid: 'sample',
            support_type: req.fields.type,
            link: req.fields.link,
            content: req.fields.content,
        }).catch((err) => {
            console.log(err)
        })
        res.send('Success')
        res.redirect('')
    }
})

router.get('/helpdesk-success', (req, res) => {
    return res.render('support-success.hbs')
})

module.exports = router
