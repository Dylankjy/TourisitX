const express = require('express')

const router = express.Router()

router.get('/', (req, res)=>{
    const metadata = {
        title: 'YESYESYES',
    }
    res.render('customer-home', metadata)
})


module.exports = router
