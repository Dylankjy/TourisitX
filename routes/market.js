const express = require('express')
const formidable = require('express-formidable')
const { Shop } = require('../models')

const router = express.Router()
router.use(formidable())

router.get('/', (req, res) => {
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        // limit: Set a limit on number of examples to retrieve
    })
        .then(async (data)=>{
            await data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })
            return listings
            // return res.render('marketplace.hbs', { listings: listings })
        }).then((listings)=>{
            return res.render('marketplace.hbs', { listings: listings })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


module.exports = router
