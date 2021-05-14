const express = require('express')

const router = express.Router()

// Put all your routings below this line -----

// router.get('/', (req, res) => { ... }
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs')
})

router.get('/settings', (req, res) => {
    res.render('users/setting.hbs')
})


module.exports = router
