const express = require('express')

const router = express.Router()

router.get('/', (req, res) => {
    const metadata = {
        meta: {
            title: 'Home',
            path: false,
        },
        nav: {
            index: true,
        },
        listing: [
            {
                name: 'Test listing',
                desc: 'This is a test listing',
                place: 'Gardens by the Bay',
            },
            {
                name: 'Test listing',
                desc: 'This is a test listing',
                place: 'Gardens by the Bay',
            },
            {
                name: 'Test listing',
                desc: 'This is a test listing',
                place: 'Gardens by the Bay',
            },
        ],
    }
    res.render('index', metadata)
})


module.exports = router
