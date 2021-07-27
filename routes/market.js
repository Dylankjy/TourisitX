const express = require('express')
const formidable = require('express-formidable')
const routesConfig = require('../config/routes.json')

const nginxBaseUrl = routesConfig['base_url']
const { Shop } = require('../models')

const router = express.Router()
router.use(formidable())

router.get('/', (req, res) => {
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        where: {
            // Only return non hidden listings
            hidden: 'false',
        },
        // limit: Set a limit on number of examples to retrieve
    })
        .then(async (data)=>{
            await data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })
            return listings
            // return res.render('marketplace.hbs', { listings: listings })
        }).then((listings)=>{
            const metadata = {
                listings: listings,
                data: {
                    currentUser: req.currentUser,
                    tourCount: listings.length,
                },
                nginxRoute: nginxBaseUrl,
            }
            return res.render('marketplace.hbs', metadata)
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


module.exports = router
