const { Shop } = require('../models')
const express = require('express')

const router = express.Router()

router.get('/', (req, res)=>{
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        limit: 4,
        order:
            [['createdAt', 'ASC']],
    })
        .then(async (data)=>{
            await data.forEach((doc)=>{
                listings.push(doc['dataValues'])
            })

            const metadata = {
                meta: {
                    title: 'Home',
                    path: false,
                },
                nav: {
                    index: true,
                },
                listing: listings,
            }
            return res.render('index', metadata)
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


router.get('/wishlist', (req, res) => {
    const wishlist = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
    })
        .then(async (data)=>{
            await data.forEach((doc)=>{
                wishlist.push(doc['dataValues'])
            })

            return res.render('customer/wishlist', { wishlist: wishlist })
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


module.exports = router
