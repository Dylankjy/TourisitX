const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/p', (req, res) => {
     res.render('users/p1.hbs')
})


module.exports = router