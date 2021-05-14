const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/helpdesk', (req, res) => {
     res.render('users/profile.hbs')
})

module.exports = router