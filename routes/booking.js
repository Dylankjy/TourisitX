const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }

// to-do: change app.js route to bookings for consistency

router.get('/', (req, res) => {
    res.render('allBookings.hbs')
})

router.get('/:id', (req, res) => {
    res.render('myBooking.hbs')
})

// for testing purposes
// router.get('/booknow', (req, res) => {
//     res.render('partials/bookNowModal.hbs')
// })

module.exports = router
