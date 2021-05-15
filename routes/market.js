const express = require('express')
const { Shop } = require('../models')

const router = express.Router()

router.get('/', (req, res) => {
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        // limit: Set a limit on number of examples to retrieve
    })
        .then((data)=>{
            data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })
            console.log(listings)
            res.render('marketplace.hbs', { listings: listings })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


module.exports = router
