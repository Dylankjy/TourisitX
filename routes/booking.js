const express = require('express')
const { default: axios } = require('axios')

const router = express.Router()
const { Shop, User, Booking, ChatRoom, TourPlans } = require('../models')

const uuid = require('uuid')
const path = require('path')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const Validator = formidableValidator.Validator

const genkan = require('../app/genkan/genkan')
const db = require('../app/db.js')
const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray, getUserfromSid } = require('../app/helpers')
const { parse } = require('path')

// Put all your routings below this line -----

const sampletimeline = [
    { messageId: '1',
        messageText: 'You booked this tour.',
        flag: 'COMPLETE',
        senderId: '0' },

    { messageId: '2',
        messageText: 'You submitted your requirements.',
        flag: 'COMPLETE',
        senderId: '0' },

    { messageId: '3',
        messageText: 'George acknowledged your requirements.',
        flag: 'COMPLETE',
        senderId: '0' },

    // { messageId: '4',
    //     messageText: 'George posted a draft of the Tour Plan (#1)',
    //     flag: 'COMPLETE',
    //     senderId: '0' },

    { messageId: '5',
        messageText: '1',
        // index of plan
        flag: 'TOURPLAN',
        senderId: 'tourplanid' },

    { messageId: '6',
        messageText: 'You submitted a revision request.',
        flag: 'COMPLETE',
        senderId: '0' },
]

tourPlans = [
    { planId: '555',
        bookId: 'bookweee',
        index: 0,
        tourStart: new Date().toISOString(),
        tourEnd: new Date().toISOString(),
        tourPax: '5',
        tourPrice: '300',
        tourItinerary: 'Go to the chopper at bshan an eat some duck rice,Ride to outskirts of SG e',
        accepted: '-1' },
]

// router.get('/', (req, res) => {
//     return res.render('allBookings.hbs')
// })

router.get('/', async (req, res) => {
    const sid = req.signedCookies.sid
    let pageNo = req.query.page
    const pageSize = 1
    let offset = 0
    if (pageNo) {
        pageNo = parseInt(pageNo)
        offset = pageSize * (pageNo - 1)
    } else {
        pageNo = 1
    }

    // If person is not logged in
    if (sid == undefined) {
        return requireLogin(res)
    } else {
        const userData = await genkan.getUserBySessionAsync(sid)
        Booking.findAndCountAll({
            where: {
                custId: userData.id,
                completed: 0,
            },
            order: [['createdAt', 'ASC']],
            include: Shop,
            raw: true,
            limit: pageSize,
            offset: offset,
        })
            .then( (result) => {
                const bookCount = result.count
                const bookList = result.rows
                const lastPage = Math.ceil(bookCount / pageSize)
                // const bookList = items.map((x) => x['dataValues']).reverse()
                // console.log(bookList)

                // listingIdArray = bookList.map((x) => x['listingId'])
                // console.log(listingIdArray)
                // Shop.findAll({
                //     where: {
                //         id: listingIdArray,
                //     },
                // }) .then( (items) => {
                // const tourList = items.map((x) => x['dataValues']).reverse()
                // console.log(tourList)
                const metadata = {
                    meta: {
                        title: 'All Bookings',
                        pageNo: pageNo,
                        count: bookCount,
                        lastPage: lastPage,
                    },
                    data: {
                        currentUser: req.currentUser,
                        bookList: bookList,
                    },
                }
                return res.render('allBookings.hbs', metadata)
                // }).catch((err) => console.log)
            }).catch((err) => console.log)
    }
    // sid = req.signedCookies.sid
    // const user = await genkan.getUserBySessionAsync(sid)
    // // const userData = getUserfromSid(sid)
    // console.log(user)

    // Booking.findAll({
    //     where: {
    //         custId: user.id,
    //     },
    // })
    //     .then((items) => {
    //         console.log(items)

    //         // If user is logged in and has a valid session
    //         return res.render('allBookings.hbs', {
    //             // booking_list, listings, action_needed_list
    //             // process list of required action
    //             // maybe write a custom helper that fetches tour name for booking
    //             booking_list: bookingList,
    //             listings: listings,
    //             action_needed_list: [sampleBooking1, sampleBooking2],
    //         })
    //     }).catch((err) => console.log)
})

router.get('/:id', (req, res) => {
    const bookID = req.params.id
    // const booking = bookingList.filter((obj) => {
    //     return obj.id == bookID
    // })[0]
    Booking.findOne({
        where: {
            bookId: bookID,
        },
    }) .then(async (items) => {
        const booking = await items['dataValues']
        const sid = req.signedCookies.sid

        // If person is not logged in
        if (sid == undefined) {
            return requireLogin(res)
        } else {
            // Check if session is up to date. Else, require person to reloggin
            if ((await genkan.isLoggedinAsync(sid)) == false) {
            // Redirect to login page
                return requireLogin(res)
            }
            const userData = await genkan.getUserBySessionAsync(sid)

            Shop.findOne({
                where: {
                    id: booking.listingId,
                },
            }) .then(async (items) => {
                const listing = await items['dataValues']

                const metadata = {
                    meta: {
                        title: listing.tourTitle,
                    },
                    data: {
                        currentUser: req.currentUser,
                    },
                    booking: booking,
                    listing: listing,
                    timeline: sampletimeline,
                    tourPlans: tourPlans,
                }
                console.log(booking)
                console.log(listing)
                return res.render('myBooking.hbs', metadata)
            }).catch((err) => console.log)
        }
    }).catch((err) => console.log)

    // const tourID = booking['tour_id']
    // const listing = listings.filter((obj) => {
    //     return obj.id == tourID
    // })[0]
    // console.log(booking)
    // console.log(listing)
    // return res.render('myBooking.hbs', { booking: booking, listing: listing })
})

module.exports = router
