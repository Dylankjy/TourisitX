const express = require('express')
const { default: axios } = require('axios')

const router = express.Router()
const { Shop, User, Booking, ChatRoom, TourPlans, ChatMessages } = require('../models')

const uuid = require('uuid')

const formidableValidator = require('../app/validation')
const formidable = require('express-formidable')
const Validator = formidableValidator.Validator

const genkan = require('../app/genkan/genkan')
const { requireLogin, requirePermission, removeNull, emptyArray, removeFromArray, getUserfromSid } = require('../app/helpers')
const { addRoom, getAllBookingMessagesByRoomID } = require('../app/chat/chat')

// Sync loops
const syncLoop = require('sync-loop')

// Put all your routings below this line -----

const tourPlans = [
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

router.get('/', async (req, res) => {
    const sid = req.signedCookies.sid
    let pageNo = req.query.page
    const pageSize = 5
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
                approved: 1,
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
})

router.get('/:id', (req, res) => {
    // console.log(req.currentUser.name)
    const bookID = req.params.id
    // const booking = bookingList.filter((obj) => {
    //     return obj.id == bookID
    // })[0]
    Booking.findOne({
        where: {
            bookId: bookID,
        },
        include: Shop, TourPlans,
        raw: true,
    }) .then((result) => {
        // console.log(result)
        // const sid = req.signedCookies.sid
        // const userId = await genkan.getUserBySessionAsync(sid)

        // (^ ω ^) thx
        // are u reading the commit logs again lmaoo
        getAllTypesOfMessagesByRoomID(result.chatId, (chatroomObject) => {
            console.log(chatroomObject)

            const listOfParticipantNames = []

            // This is a hacky way to get the names of the participants in a chat room.
            syncLoop(chatroomObject.users.length, (loop) => {
                const i = loop.iteration()

                genkan.getUserByID(chatroomObject.users[i], (userObject) => {
                    // console.log(userObject)
                    listOfParticipantNames.push(userObject.name)
                    loop.next()
                })
            }, () => {
                genkan.getUserByID(result['Shop.userId'], (tgData) => {
                    console.log(tgData)
                    const metadata = {
                        meta: {
                            title: result['Shop.tourTitle'],
                        },
                        data: {
                            currentUser: req.currentUser,
                            book: result,
                            timeline: chatroomObject.msg,
                            // This is the list of names of participants in the chat room.
                            participants: listOfParticipantNames,
                            tg: tgData,
                        },
                        tourPlans: tourPlans,
                    }
                    return res.render('myBooking.hbs', metadata)
                })
            })
        })
    })
})

module.exports = router
