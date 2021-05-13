const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/booknow', (req, res) => {
    // have not connected to book now button in listings, for testing prupsoedsd
    res.render('partials/bookNowModal.hbs')
})

module.exports = router
