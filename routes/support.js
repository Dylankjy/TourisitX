const express = require('express')
const uuid = require('uuid')


const router = express.Router()
const { Support } = require('../models')

// Block if not logged in
const loginRequired = (req, res, next) => {
    genkan.isLoggedin(req.signedCookies.sid, (result) => {
        if (result !== true) {
            res.status = 401
            return res.redirect(302, '/id/login?required=1')
        }

        return next()
    })
}

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/', loginRequired, (req, res) => {
    return res.render('support.hbs')
})

router.post('/', loginRequired, (req, res) => {
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

router.get('/helpdesk-success', loginRequired, (req, res) => {
    return res.render('support-success.hbs')
})

module.exports = router
