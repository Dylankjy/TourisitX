const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

router.get('/', (req, res) => {
    res.render('myBooking.hbs')
})

// router.get('/booknow', (req, res) => {
//     res.render('partials/bookNowModal.hbs')
// })

module.exports = router
