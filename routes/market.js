const express = require('express')
const formidable = require('express-formidable')
const routesConfig = require('../config/routes.json')

const nginxBaseUrl = routesConfig['base_url']
const { Shop } = require('../models')

const router = express.Router()
router.use(formidable())

router.get('/', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }
    const pageNo = parseInt(req.query.page)
    const entriesPerPage = 4
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        // limit: Set a limit on number of examples to retrieve
        limit: entriesPerPage,
        offset: (pageNo - 1) * entriesPerPage,
        where: {
            // Only return non hidden listings
            hidden: 'false',
        },
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


router.get('/api', (req, res) => {
    if (req.query.page === undefined) {
        return res.redirect('?page=1')
    }
    const pageNo = parseInt(req.query.page)
    const entriesPerPage = 4
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        // limit: Set a limit on number of examples to retrieve
        limit: entriesPerPage,
        offset: (pageNo - 1) * entriesPerPage,
        where: {
            // Only return non hidden listings
            hidden: 'false',
        },
    })
        .then(async (data)=>{
            await data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })
            return res.json({ listings: listings })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


module.exports = router
