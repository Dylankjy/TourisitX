const genkan = require('../app/genkan/genkan')
const { Shop, User } = require('../models')
const sequelize = require('sequelize')
const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray } = require('../app/helpers')
const express = require('express')

const router = express.Router()

router.get('/', (req, res) => {
    const listings = []
    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        limit: 4,
        order:
            [['createdAt', 'ASC']],
        where: {
            hidden: "false"
        }
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
                data: {
                    currentUser: req.currentUser,
                },
            }
            return res.render('index', metadata)
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


router.get('/wishlist', async (req, res) => {
    const sid = req.signedCookies.sid

    if (sid == undefined) {
        return requireLogin(res)
    }

    if ((await genkan.isLoggedinAsync(sid)) == false) {
        // Redirect to login page
        return requireLogin(res)
    }

    const userData = await genkan.getUserBySessionAsync(sid)
    const userWishlistArr = removeNull(userData.wishlist.split(';!;'))

    // if (emptyArray(userWishlistArr)) {
    //     return res.render('customer/wishlist', { wishlist: [], message:  })
    // }

    Shop.findAll({
        attributes: ['id', 'tourTitle', 'tourDesc', 'tourImage'],
        where: {
            id: userWishlistArr,
        },
    })
        .then(async (data)=>{
            const wishlist = []
            await data.forEach((doc)=>{
                wishlist.push(doc['dataValues'])
            })

            const metadata = {
                meta: {
                    title: 'Wishlist',
                    path: false,
                },
                nav: {
                    wishlist: true,
                },
                listing: wishlist,
                data: {
                    currentUser: req.currentUser,
                },
                wishlist: wishlist,
            }

            return res.render('customer/wishlist', metadata)
        })
        .catch((err)=>{
            console.log(err)
            res.json({ 'Message': 'Failed' })
        })
})


module.exports = router
